
module nft_war::wolf_witch {
    use std::error;
    use std::bcs;
    use std::signer;
    use std::option::{Self};
    use std::string::{Self, String};
    use std::vector;    
    use aptos_std::from_bcs;
    use std::hash;

    use aptos_framework::guid;
    use aptos_framework::account;
    use aptos_framework::block;
    use aptos_framework::transaction_context;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::coin;
    use aptos_std::table::{Self, Table};    
    use aptos_token::token::{Self};
    use aptos_token::property_map::{Self};

    const FEE_DENOMINATOR: u64 = 100000;    
    
    const ENOT_READY_END: u64 = 1;
    const ENOT_PUBLIC: u64 = 2;    
    const ENOT_ENOUGH_NFT: u64 = 3;
    const ENOT_READY_MINT:u64 = 4;
    const EONGOING_GAME:u64 = 5;
    const ESAME_TYPE:u64 = 6;
    const ENOT_IN_BATTLE:u64 = 7;
    const ECANT_FIGHT:u64 = 8;
    const ENOT_WIN_FACTION:u64 = 9;

    const ENOT_AUTHORIZED: u64 = 10;

    // Game Configs
    const PRICE_FOR_NFT:u64 = 10000000; // 0.1 APT
    const RATIO_FOR_WIN:u64 = 7; // at least 70% of witches or werewolves should be alive in the war

    const BURNABLE_BY_CREATOR: vector<u8> = b"TOKEN_BURNABLE_BY_CREATOR";    
    const BURNABLE_BY_OWNER: vector<u8> = b"TOKEN_BURNABLE_BY_OWNER";
    const TOKEN_PROPERTY_MUTABLE: vector<u8> = b"TOKEN_PROPERTY_MUTATBLE";    
    
    // property for game
    const GAME_STRENGTH: vector<u8> = b"TOKEN_GAME_STRENGTH";
    const IS_WOLF: vector<u8> = b"TOKEN_IS_WOLF";
    

    // This struct stores an NFT collection's relevant information
    struct WarGame has store, key {          
        signer_cap: account::SignerCapability,        
        minimum_elapsed_time:u64,
        wolf: u64, // count for wolves
        witch: u64, // count for witches
        total_prize:u64,
        total_nft_count:u64,
        public_mint_price:u64,
        public_mint_start_timestamp:u64,
        is_on_game: bool,
        token_url:String,        
        token_description:String,
        token_royalty_points_numerator:u64   
    }

    struct CollectionId has store, copy, drop {
        creator: address,
        name: String,
    }    


    struct GameEvents has key {
        token_minting_events: EventHandle<TokenMintingEvent>,
        collection_created_events: EventHandle<CollectionCreatedEvent>,
        create_game_event: EventHandle<CreateGameEvent>,
        list_fighter_events: EventHandle<ListFighterEvent>,
        delist_fighter_events:EventHandle<DeListFighterEvent>,
        game_score_changed_events: EventHandle<GameScoreChangedEvent>, 
        game_result_events: EventHandle<GameResultEvent>, 
        war_state_events: EventHandle<WarStateEvent>
    }    

    struct CreateGameEvent has drop, store {        
        collection_id: CollectionId,
    }

    struct GameResultEvent has drop, store {
        win: bool        
    }

    struct CollectionCreatedEvent has drop, store {        
        collection_id: CollectionId,
    }
    

    struct BatteArena has key {
        listings: Table<token::TokenId, ListingFighter>
    }

    struct ListingFighter has drop, store {                          
        listing_id: u64,
        owner: address,        
    }    

    struct WarStateEvent has drop,store {
        in_war: bool
    }
    
    struct GameScoreChangedEvent has drop,store {
        wolf: u64, // count for wolves
        witch: u64, // count for witches
        total_prize: u64,
        total_nft_count:u64,
    }

    struct TokenMintingEvent has drop, store {
        token_receiver_address: address,        
        is_wolf: bool,
        public_price: u64
    }

    struct ListFighterEvent has drop, store {
        timestamp: u64,
        token_id:token::TokenId,
        is_wolf: bool,
        strength: u64,
        listing_id: u64,
        owner: address,
    }
    struct DeListFighterEvent has drop, store {
        timestamp: u64,
        token_id:token::TokenId,        
        owner: address,
    }
        
    // utils
    public fun average(a: u64, b: u64): u64 {
        if (a < b) {
            a + (b - a) / 2
        } else {
            b + (a - b) / 2
        }
    }

    fun get_resource_account_cap(minter_address : address) : signer acquires WarGame {
        let minter = borrow_global<WarGame>(minter_address);
        account::create_signer_with_capability(&minter.signer_cap)
    }    

    fun to_string(value: u128): String {
        if (value == 0) {
            return string::utf8(b"0")
        };
        let buffer = vector::empty<u8>();
        while (value != 0) {
            vector::push_back(&mut buffer, ((48 + value % 10) as u8));
            value = value / 10;
        };
        vector::reverse(&mut buffer);
        string::utf8(buffer)
    }

    // admin functions
    public entry fun admin_withdraw<CoinType>(sender: &signer, price: u64) acquires WarGame {
        let sender_addr = signer::address_of(sender);
        let resource_signer = get_resource_account_cap(sender_addr);                                
        let coins = coin::withdraw<CoinType>(&resource_signer, price);                
        coin::deposit(sender_addr, coins);
    }

    public entry fun admin_deposit<CoinType>(sender: &signer, game_address:address, price: u64) acquires WarGame {
        let game = borrow_global_mut<WarGame>(game_address);        
        assert!(!game.is_on_game, error::permission_denied(EONGOING_GAME));
        // let game_events = borrow_global_mut<GameEvents>(game_address);                        
        game.total_prize = game.total_prize + price;
        let sender_addr = signer::address_of(sender);
        let resource_signer = get_resource_account_cap(sender_addr);                        
        let coins = coin::withdraw<CoinType>(sender, price);        
        coin::deposit(signer::address_of(&resource_signer), coins);        
    }            
    
    public entry fun init_game<CoinType>(sender: &signer,
        _minimum_elapsed_time:u64, token_url: String, 
        token_description:String, royalty_points_numerator:u64, public_mint_start_timestamp:u64) {
        let sender_addr = signer::address_of(sender);                
        let (resource_signer, signer_cap) = account::create_resource_account(sender, x"01");    
        token::initialize_token_store(&resource_signer);
        
        // to prevent early end.
        let time_to_end = timestamp::now_seconds() + _minimum_elapsed_time;

        if(!exists<WarGame>(sender_addr)){
            
            move_to(sender, WarGame{                
                signer_cap,
                is_on_game: false,
                wolf: 0,
                witch: 0,
                total_prize: 0,
                total_nft_count: 0,
                public_mint_price: PRICE_FOR_NFT,
                minimum_elapsed_time: time_to_end,
                public_mint_start_timestamp,
                token_url, 
                token_description,
                token_royalty_points_numerator:royalty_points_numerator
            });
        };        

        if(!exists<GameEvents>(sender_addr)){
            move_to(sender, GameEvents {
                token_minting_events: account::new_event_handle<TokenMintingEvent>(sender),
                collection_created_events: account::new_event_handle<CollectionCreatedEvent>(sender),
                create_game_event: account::new_event_handle<CreateGameEvent>(sender),
                list_fighter_events: account::new_event_handle<ListFighterEvent>(sender),
                delist_fighter_events: account::new_event_handle<DeListFighterEvent>(sender),
                game_score_changed_events: account::new_event_handle<GameScoreChangedEvent>(sender), 
                game_result_events: account::new_event_handle<GameResultEvent>(sender),                
                war_state_events: account::new_event_handle<WarStateEvent>(sender)
            });
        };        

        if(!exists<BatteArena>(sender_addr)){
            move_to(sender, BatteArena{
                listings: table::new()
            });
        };
            
        if(!coin::is_account_registered<CoinType>(signer::address_of(&resource_signer))){
            coin::register<CoinType>(&resource_signer);
        };        
    }    

    // create a collection minter for game 
    public entry fun create_game<CoinType> (
        _sender: &signer,
        game_address:address,                
        collection: String, description: String, 
        collection_uri: String, maximum_supply: u64, mutate_setting: vector<bool>,
        token_url: String, royalty_points_numerator:u64       
        ) acquires WarGame, GameEvents {
                                        
        let resource_signer = get_resource_account_cap(game_address);        
        token::create_collection(&resource_signer, collection, description, collection_uri, maximum_supply, mutate_setting);        

        let game = borrow_global_mut<WarGame>(game_address);
        game.is_on_game = true;
        game.token_url = token_url;
        game.token_description = description;
        game.token_royalty_points_numerator = royalty_points_numerator;

        // emit events 
        let game_events = borrow_global_mut<GameEvents>(game_address);        
        event::emit_event(&mut game_events.war_state_events, WarStateEvent { in_war: true }); 
    }

    // register for battle
    public entry fun listing_battle<CoinType> ( 
        owner: &signer,
        game_address:address,
        creator:address, collection:String, name: String, property_version: u64,
        ) acquires WarGame, GameEvents, BatteArena {
                                                
        let resource_signer = get_resource_account_cap(game_address);
        let owner_addr = signer::address_of(owner);
        let token_id = token::create_token_id_raw(creator, collection, name, property_version);
        let guid = account::create_guid(&resource_signer);
        let listing_id = guid::creation_num(&guid);        
        
        let pm = token::get_property_map(signer::address_of(owner), token_id);                
        let is_wolf = property_map::read_bool(&pm, &string::utf8(IS_WOLF));
        let token_id_str = property_map::read_u64(&pm, &string::utf8(GAME_STRENGTH));

        let token = token::withdraw_token(owner, token_id, 1);
        token::deposit_token(&resource_signer, token);        

        let battle_field = borrow_global_mut<BatteArena>(game_address);
                                        
        table::add(&mut battle_field.listings, token_id, ListingFighter {
            listing_id: listing_id,
            owner:owner_addr
        });
                
        let game_events = borrow_global_mut<GameEvents>(game_address);       
        
        event::emit_event(&mut game_events.list_fighter_events, ListFighterEvent {            
            owner: owner_addr,
            token_id: token_id,
            is_wolf: is_wolf,
            strength: token_id_str,
            listing_id: listing_id,
            timestamp: timestamp::now_microseconds(),
        });
        
    }

    public entry fun delisting_battle<CoinType> (
        sender: &signer,
        game_address:address,
        creator:address,collection:String, name: String, property_version: u64        
        ) acquires WarGame, GameEvents, BatteArena{

        let sender_addr = signer::address_of(sender);       
        let resource_signer = get_resource_account_cap(game_address);        
        let token_id = token::create_token_id_raw(creator, collection, name, property_version);        
                
        let battle_field = borrow_global_mut<BatteArena>(game_address);
        let fighter = table::borrow(&battle_field.listings, token_id);

        assert!(fighter.owner == sender_addr, error::permission_denied(ENOT_AUTHORIZED));
        
        let token = token::withdraw_token(&resource_signer, token_id, 1);
        token::deposit_token(sender, token);

        table::remove(&mut battle_field.listings, token_id);
        
        let game_events = borrow_global_mut<GameEvents>(game_address);       
        
        event::emit_event(&mut game_events.delist_fighter_events, DeListFighterEvent {            
            owner: sender_addr,            
            token_id: token_id,
            timestamp: timestamp::now_microseconds(),            
        });
        
    }

    public entry fun battle<CoinType>(holder: &signer, 
        game_address:address, 
        creator:address, 
        collection:String, 
        name_1: String, property_version_1: u64, // me 
        name_2: String, property_version_2: u64, // enemy               
        ) acquires WarGame, BatteArena, GameEvents {
        let resource_signer = get_resource_account_cap(game_address);
        let resource_account_address = signer::address_of(&resource_signer);
        let token_id_1 = token::create_token_id_raw(creator, collection, name_1, property_version_1);        
        let token_id_2 = token::create_token_id_raw(creator, collection, name_2, property_version_2);
        let battle_field = borrow_global_mut<BatteArena>(game_address);            
        
        assert!(table::contains(&mut battle_field.listings, token_id_2), error::permission_denied(ENOT_IN_BATTLE));
        // check type of nft        
        let pm = token::get_property_map(signer::address_of(holder), token_id_1);                
        let is_wolf_1 = property_map::read_bool(&pm, &string::utf8(IS_WOLF));

        let pm2 = token::get_property_map(signer::address_of(&resource_signer), token_id_2);                
        let is_wolf_2 = property_map::read_bool(&pm2, &string::utf8(IS_WOLF));
        assert!(is_wolf_1 != is_wolf_2, error::permission_denied(ESAME_TYPE));

        // get strength from NFT
        
        let token_id_1_str = property_map::read_u64(&pm, &string::utf8(GAME_STRENGTH));
        let token_id_2_str = property_map::read_u64(&pm2, &string::utf8(GAME_STRENGTH));

        let random = random(resource_account_address, 100) + 1;
        let diff = if(token_id_1_str > token_id_2_str) { token_id_1_str - token_id_2_str } else { token_id_2_str - token_id_1_str }; 
        assert!(diff < 15, error::permission_denied(ECANT_FIGHT));
        let strong_one = if(token_id_1_str > token_id_2_str) { name_1 } else { name_2 }; 
        let fighter = table::borrow(&battle_field.listings, token_id_2);
        
        // common global muts
        let game_events = borrow_global_mut<GameEvents>(game_address);        
        if(name_1 == strong_one) {
             // can't fight if enemy is too strong.
            if(random < (51 + diff)) { // if i win
                let battle_field = borrow_global_mut<BatteArena>(game_address);            
                let token = token::withdraw_token(&resource_signer, token_id_2, 1);
                token::deposit_token(holder, token);
                table::remove(&mut battle_field.listings, token_id_2);                                       
                event::emit_event(&mut game_events.delist_fighter_events, DeListFighterEvent {            
                    owner: signer::address_of(holder),                    
                    token_id: token_id_2,
                    timestamp: timestamp::now_microseconds(),            
                });
                event::emit_event(&mut game_events.game_result_events, GameResultEvent {            
                    win: true                    
                });
            } else { // if i lose            
                let token = token::withdraw_token(holder, token_id_1, 1);                        
                token::direct_deposit_with_opt_in(fighter.owner, token);
                event::emit_event(&mut game_events.game_result_events, GameResultEvent {            
                    win: false                    
                });
            };
        } else {
            if(random < (51 - diff)) { // if i lose
                let battle_field = borrow_global_mut<BatteArena>(game_address);            
                let token = token::withdraw_token(&resource_signer, token_id_2, 1);
                token::deposit_token(holder, token);
                table::remove(&mut battle_field.listings, token_id_2);

                event::emit_event(&mut game_events.delist_fighter_events, DeListFighterEvent {            
                    owner: signer::address_of(holder),                    
                    token_id: token_id_2,
                    timestamp: timestamp::now_microseconds(),            
                });
                event::emit_event(&mut game_events.game_result_events, GameResultEvent {            
                    win: true                    
                });                
            } else { // if i lose            
                let token = token::withdraw_token(holder, token_id_1, 1);                        
                token::direct_deposit_with_opt_in(fighter.owner, token);
                event::emit_event(&mut game_events.game_result_events, GameResultEvent {            
                    win: false                    
                });                
            };
        }        
        // let game = borrow_global_mut<WarGame>(game_address);    
    }

    public entry fun end_game(game_address:address) acquires WarGame, GameEvents {
        // check game it could be end
        let game = borrow_global_mut<WarGame>(game_address);
        let minimum_elapsed_time = game.minimum_elapsed_time;
        let nft_count = game.total_nft_count;
        // at least 10 nfts required to be end
        assert!(nft_count > 10, error::permission_denied(ENOT_ENOUGH_NFT));
        let minimum_alive = (nft_count / 10) * RATIO_FOR_WIN;        
        let bigger = if (game.wolf > game.witch) { game.wolf } else { game.witch };

        let is_game_over = if(bigger > minimum_alive) { true } else { false };

        assert!(is_game_over, error::permission_denied(ENOT_READY_END));
        assert!(minimum_elapsed_time < timestamp::now_seconds() , error::permission_denied(ENOT_READY_END));        

        let game = borrow_global_mut<WarGame>(game_address);
        game.is_on_game = false;

        let game_events = borrow_global_mut<GameEvents>(game_address);        
        event::emit_event(&mut game_events.war_state_events, WarStateEvent { in_war: false }); 
    }

    public entry fun withdraw_prize<CoinType> (sender: &signer, 
        game_address:address, creator:address, collection:String, name: String, property_version:u64) acquires WarGame {
        let sender_addr = signer::address_of(sender);
        let game = borrow_global_mut<WarGame>(game_address);
        
        let token_id_1 = token::create_token_id_raw(creator, collection, name, property_version);                                            
        let pm = token::get_property_map(signer::address_of(sender), token_id_1);                
        let is_wolf = property_map::read_bool(&pm, &string::utf8(IS_WOLF));
        let wolf_win = if (game.wolf > game.witch) { true } else { false };
        assert!(is_wolf == wolf_win, error::permission_denied(ENOT_WIN_FACTION));
        // after end game can get prize
        assert!(!game.is_on_game, error::permission_denied(EONGOING_GAME));
        // let game_events = borrow_global_mut<GameEvents>(game_address); 
        // TODO :: shoud check which faction is won.                 
        let total_prize = game.total_prize;        
        let winner_count = if (game.wolf > game.witch) { game.wolf } else { game.witch };
        let prize_per_each = total_prize / winner_count;
        let resource_signer = get_resource_account_cap(game_address);         
        let coins = coin::withdraw<CoinType>(&resource_signer, prize_per_each);                        
        coin::deposit(sender_addr, coins); 
        token::burn(sender, creator, collection, name, property_version, 1);                        
    }

    public entry fun mint_token<CoinType>(
        receiver: &signer, game_address:address, 
        collection: String) 
        acquires WarGame, GameEvents {
                
        let resource_signer = get_resource_account_cap(game_address); 
        let resource_account_address = signer::address_of(&resource_signer);
        
        let receiver_address = signer::address_of(receiver);
        
        // special features                
        let minter = borrow_global<WarGame>(game_address);                
        assert!(timestamp::now_seconds() > minter.public_mint_start_timestamp, error::permission_denied(ENOT_READY_MINT));                
        assert!(minter.is_on_game, error::permission_denied(EONGOING_GAME));
        // get random 
        let random = random(receiver_address, 2) + 1;
        let isWolf = if (random == 1) { true } else { false };
        
        let price_for_mint = minter.public_mint_price;
        let coins = coin::withdraw<CoinType>(receiver, price_for_mint);
        coin::deposit(resource_account_address, coins);  // send to vault for prize for winners

        let uri = string::utf8(b"");
        let token_description = minter.token_description;
        let royalty_points_numerator = minter.token_royalty_points_numerator;

        let supply_count = &mut token::get_collection_supply(resource_account_address, collection);        
        let new_supply = option::extract<u64>(supply_count);
        let count_string = to_string((new_supply as u128));
        let token_name = collection;
        string::append_utf8(&mut token_name, b" #");
        string::append(&mut token_name, count_string);
        // add uri json string        
        if(isWolf) {
            string::append_utf8(&mut uri, b"https://bafkreia5uxmjunhno4vlps2sdskg6ny6rlvarsftncxmp7tvsmroyjatka.ipfs.nftstorage.link/");
        } else {
            string::append_utf8(&mut uri, b"https://bafkreia5lkt2jhecdxjnytbrxt46ochqksf465avet4lupycsgvtdpyo2u.ipfs.nftstorage.link/");
        };

        if(token::check_tokendata_exists(resource_account_address, collection, token_name)){
            let i = 0;
            let token_name_new = collection;
            let collection_max_count = new_supply;
            while (i < collection_max_count + 1) {
                let new_token_name = token_name_new;
                let new_uri = string::utf8(b"");
                string::append_utf8(&mut new_token_name, b" #");
                let count_string = to_string((i as u128));
                string::append(&mut new_token_name, count_string);
                if(isWolf) {
                    string::append_utf8(&mut uri, b"https://bafkreia5uxmjunhno4vlps2sdskg6ny6rlvarsftncxmp7tvsmroyjatka.ipfs.nftstorage.link/");
                } else {
                    string::append_utf8(&mut new_uri, b"https://bafkreia5lkt2jhecdxjnytbrxt46ochqksf465avet4lupycsgvtdpyo2u.ipfs.nftstorage.link/");
                };
                
                if(!token::check_tokendata_exists(resource_account_address, collection, new_token_name)) {
                    token_name = new_token_name;
                    uri = new_uri;
                    break
                };
                i = i + 1;
            }; 
                                      
        }; 

        let mutability_config = &vector<bool>[ false, true, true, true, true ];

        let randomStrength = random(receiver_address, 5) + 1;
        let token_data_id = token::create_tokendata(
                &resource_signer,
                collection,
                token_name,
                token_description,
                1, // 1 maximum for NFT 
                uri,
                resource_account_address, // royalty fee to
                FEE_DENOMINATOR,
                royalty_points_numerator,
                // we don't allow any mutation to the token
                token::create_token_mutability_config(mutability_config),
                // type
                vector<String>[string::utf8(BURNABLE_BY_OWNER),string::utf8(TOKEN_PROPERTY_MUTABLE), string::utf8(GAME_STRENGTH), string::utf8(IS_WOLF)],  // property_keys                
                vector<vector<u8>>[bcs::to_bytes<bool>(&true),bcs::to_bytes<bool>(&true), bcs::to_bytes<u64>(&randomStrength), bcs::to_bytes<bool>(&isWolf)],  // values 
                vector<String>[string::utf8(b"bool"),string::utf8(b"bool"), string::utf8(b"u64"), string::utf8(b"bool")],      // type
        );

        let token_id = token::mint_token(&resource_signer, token_data_id, 1);
        token::opt_in_direct_transfer(receiver, true);
        token::direct_transfer(&resource_signer, receiver, token_id, 1);
        
        let game = borrow_global_mut<WarGame>(game_address);
        
        if(isWolf) {             
            game.wolf = game.wolf + 1;
            } else { 
            game.witch = game.witch + 1;
        };        
        game.total_prize = game.total_prize + price_for_mint;
        game.total_nft_count = game.total_nft_count + 1;
        // emit events 
        let game_events = borrow_global_mut<GameEvents>(game_address);        
     
        event::emit_event(&mut game_events.token_minting_events, TokenMintingEvent { 
            token_receiver_address: receiver_address,
            is_wolf:isWolf,
            public_price: price_for_mint,
        });

        event::emit_event(&mut game_events.game_score_changed_events, GameScoreChangedEvent { 
            wolf:game.wolf,
            witch:game.witch,
            total_prize: game.total_prize,
            total_nft_count:game.total_nft_count,
        }); 
        
    }

    // burn enemy nft and get strength
    public entry fun burn_token_and_enhance<CoinType>(
        holder: &signer, 
        game_address:address, 
        creator:address,
        collection:String, 
        name_1: String, property_version_1: u64, // mine
        name_2: String, property_version_2: u64, // target
        ) acquires WarGame, GameEvents {
        let resource_signer = get_resource_account_cap(game_address); 
        let resource_account_address = signer::address_of(&resource_signer);
        let holder_addr = signer::address_of(holder);
        let token_id_1 = token::create_token_id_raw(creator, collection, name_1, property_version_1);                
        let token_id_2 = token::create_token_id_raw(creator, collection, name_2, property_version_2);                                      

        let pm = token::get_property_map(holder_addr, token_id_1);                
        let is_wolf_1 = property_map::read_bool(&pm, &string::utf8(IS_WOLF));
        let token_id_1_str = property_map::read_u64(&pm, &string::utf8(GAME_STRENGTH));
        
        let pm2 = token::get_property_map(holder_addr, token_id_2);                
        let is_wolf_2 = property_map::read_bool(&pm2, &string::utf8(IS_WOLF));
        
        assert!(is_wolf_1 != is_wolf_2, error::permission_denied(ESAME_TYPE));

        let token_id_2_str = property_map::read_u64(&pm2, &string::utf8(GAME_STRENGTH));        
        let random_strength = random(resource_account_address, token_id_2_str) + 1;
        let new_str = token_id_1_str + random_strength;
        token::mutate_token_properties(            
            &resource_signer,
            holder_addr,
            resource_account_address,
            collection,
            name_1,
            property_version_1,
            1,
            vector<String>[string::utf8(BURNABLE_BY_OWNER),string::utf8(TOKEN_PROPERTY_MUTABLE), string::utf8(GAME_STRENGTH), string::utf8(IS_WOLF)],  // property_keys                
            vector<vector<u8>>[bcs::to_bytes<bool>(&true),bcs::to_bytes<bool>(&true), bcs::to_bytes<u64>(&new_str), bcs::to_bytes<bool>(&is_wolf_1)],  // values 
            vector<String>[string::utf8(b"bool"),string::utf8(b"bool"), string::utf8(b"u64"), string::utf8(b"bool")],      // type
        );        
        
        let game = borrow_global_mut<WarGame>(game_address);
        game.total_nft_count = game.total_nft_count - 1;
        if(is_wolf_2) { // if enemy is wolf
            game = borrow_global_mut<WarGame>(game_address);
            game.wolf = game.wolf - 1;        
        } else {
            game = borrow_global_mut<WarGame>(game_address);
            game.witch = game.witch - 1;        
        };        
        
        token::burn(holder, creator, collection, name_2, property_version_2, 1);        
        
        let game_events = borrow_global_mut<GameEvents>(game_address);        
        event::emit_event(&mut game_events.game_score_changed_events, GameScoreChangedEvent { 
            wolf:game.wolf,
            witch:game.witch,
            total_prize: game.total_prize,
            total_nft_count:game.total_nft_count,
        }); 
    }

    public fun random(add:address, max:u64):u64
    {                
        let block_height = block::get_current_block_height();
        let number = timestamp::now_microseconds() + block_height % 10000;
        let x = bcs::to_bytes<address>(&add);
        let y = bcs::to_bytes<u64>(&number);
        let z = bcs::to_bytes<u64>(&timestamp::now_seconds());
        vector::append(&mut x,y);
        vector::append(&mut x,z);
        let script_hash: vector<u8> = transaction_context::get_script_hash();
        vector::append(&mut x,script_hash);
        let tmp = hash::sha2_256(x);

        let data = vector<u8>[];
        let i =24;
        while (i < 32)
        {
            let x =vector::borrow(&tmp,i);
            vector::append(&mut data,vector<u8>[*x]);
            i= i+1;
        };
        let random = from_bcs::to_u64(data) % max;
        random
    }   
}
