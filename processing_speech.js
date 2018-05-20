/*
This is where most speech is processed from a transcript into function calls to the Brief object
 */

let name_to_id = new Map();  // dictionary matching names to their ids
let last_coordinates = undefined;  // coordinates of last piece referred to
let last_command = undefined;  // the last command given
let highlighting = [];  // pieces currently being highlighted from being referred to as "this" or "that"

// map to turn string numbers into actual integers
let string_to_int = new Map([
    ["one", 1],
    ["two", 2],
    ["three", 3],
    ["four", 4],
    ["five", 5],
    ["six", 6],
    ["seven", 7],

    ["1", 1],
    ["2", 2],
    ["3", 3],
    ["4", 4],
    ["5", 5],
    ["6", 6],
    ["7", 7],

    ["first", 1],
    ["second", 2],
    ["third", 3],
    ["fourth", 4],
    ["fifth", 5],
    ["sixth", 6],
    ["seventh", 7],

    ["1st", 1],
    ["2nd", 2],
    ["3rd", 3],
    ["4th", 4],
    ["5th", 5],
    ["6th", 6],
    ["7th", 7]]);

/*
A function serving as an upper layer to check if speech was processed correctly and warrant further processing
 */
let processSpeechHolder = function(transcript) {
    let processed = processSpeech(transcript);
    if (processed) {
        process_concurrent(transcript);
        saved_ids = {"this": undefined, "that": undefined};
        timer = setTimeout(function() {
            clear_highlight();
        }, 2000)
    }
    return processed;
};

/*
Turns a speech transcript to a function call on Brief
 */
let processSpeech = function (transcript) {
    let command = undefined;

    if (transcript !== undefined && transcript !== "") {
        console.log(transcript);
    }

    // 1. Determine Command
    let assign_keywords = ["this is", "that is", "which is", "time is now", "time is", "welcome to", "operation"];
    let add_keywords = ["place", "put", "is here", "is located here", "will be here"];
    let remove_keywords = ["eliminate", "eliminates", "eliminating", "destroyed"];
    let move_keywords = ["move", "moving", "assault", "going", " go "];
    let attack_keywords = ["attack", "attacks"];
    let support_keywords = ["support", "supporting", "suppressing", "suppressive"];
    let secure_keywords = ["secure"];

    let change_phase_keywords = ["go back to phase", "go to phase"];
    let back_keywords = ["go back"];
    let forward_keywords = ["next", "go forward"];
    let play_keywords = ["play from", "run through from", "start from"];

    if (user_said(transcript, assign_keywords)) {
        command = speechCommand.Assign;
    } else if (user_said(transcript, add_keywords)) {
        command = speechCommand.Add;
    } else if (user_said(transcript, remove_keywords)) {
        command = speechCommand.Remove;
    } else if (user_said(transcript, move_keywords)) {
        command = speechCommand.Move;
    } else if (user_said(transcript, attack_keywords)) {
        command = speechCommand.Attack;
    } else if (user_said(transcript, support_keywords)) {
        command = speechCommand.Support;
    } else if (user_said(transcript, secure_keywords)) {
        command = speechCommand.Secure;
    } else if (user_said(transcript, change_phase_keywords)) {
        command = speechCommand.ChangePhase;
    } else if (user_said(transcript, back_keywords)) {
        command = speechCommand.Back;
    } else if (user_said(transcript, forward_keywords)) {
        command = speechCommand.Forward;
    } else if (user_said(transcript, play_keywords)) {
        command = speechCommand.Play;
    }

    // 2a. Assign Command
    if (command === speechCommand.Assign) {
        if (user_said(transcript, ["phase"])) {
            let name = neighbor_word(transcript, "phase", false);
            let number = string_to_int.get(name);
            if (number === undefined) {
                return false;
            }
            brief.save_current_phase(number);
            update_info();

            return true;
        } else if (user_said(transcript, ["time is"])) {
            let success = set_time_assign(transcript);
            update_info();

            return true;
        } else if (user_said(transcript, ["operation"])) {
            let name = neighbor_word(transcript, "operation", false);
            let follow_on = neighbor_word(transcript, name, false);

            if (follow_on !== undefined) {
                name = name + " " + follow_on;
            }

            brief.set_mission_name(name);

            return true;
        }
    }

    // 2b. Add Command
    if (command === speechCommand.Add) {
        let piece;
        if (user_said(transcript, unit_sizes)) {
            piece = create_unit(transcript);
        } else if (user_said(transcript, ["objective"])) {
            piece = create_place(transcript);
        }
        if (piece === undefined) {
            return false;
        }

        if (!user_said(transcript, ["here"]) || already_existing_unit(transcript, piece)) {
            return false
        } else {
            piece.coordinates = get_board_coordinates();
            if (piece.coordinates === undefined) {
                return false;
            }
        }

        brief.add_piece(piece);

        // save after because brief.add_piece is what gives it the ID
        let name;
        if (piece.piece_type === PieceType.Unit) {
            name = save_unit(transcript, piece);
        } else if (piece.piece_type === PieceType.Place) {
            name = save_place(transcript, piece);
        }
        brief.current.pieces.set(piece.id, piece);
        update_name(piece);

        return true;
    }

    // 2c. Remove Command
    if (command === speechCommand.Remove) {
        let source = get_source(transcript);

        brief.remove_piece_initiate(source.id);
        // remove from name mapping
        name_to_id.delete(source.name);
        if (source.friendly !== true && name_to_id.has("enemy")) {
            name_to_id.delete("enemy");
        }

        return true;
    }

    // 2d. Move Command
    if (command === speechCommand.Move) {
        let source = get_source(transcript);
        let target = get_target(transcript);

        if (source === undefined || target === undefined) {
            return false;
        }

        let dd = get_distance_direction(transcript);
        if (dd !== undefined) {
            brief.move_piece(source.id, target.id, dd.direction, dd.distance);
        } else {
            brief.move_piece(source.id, target.id);
        }

        if (user_said(transcript, ["assault"]) && name_to_id.has("enemy")) {
            processSpeech("the enemy is eliminated");
        }
        return true;
    }

    // 2e. Targeted Tactic
    let target_map = new Map([[speechCommand.Attack, ActionType.Attack],
        [speechCommand.Support, ActionType.Support]]);
    if (target_map.has(command)) {
        let a_t = target_map.get(command);
        let multi;
        let source = handle_we(transcript);
        if (source !== undefined) {
            multi = true;
        } else {
            multi = false;
            source = get_source(transcript);
        }
        let target = get_target(transcript);

        if (source === undefined || target === undefined) {
            return false;
        }

        if (source.id === target.id) {
            return false;
        }

        if (multi) {
            for (let id of source) {
                brief.tactic(a_t, id, target.id);
            }
        } else {
            brief.tactic(a_t, source.id, target.id);
        }

        return true;
    }

    // 2X. Untargeted Tactic
    let untarget_map = new Map([[speechCommand.Secure, ActionType.Secure]]);
    if (untarget_map.has(command)) {
        let a_t = untarget_map.get(command);

        let source = get_source(transcript);
        let target = get_target(transcript);

        if (source.id === target.id) {
            return false;
        }

        if (target.id !== undefined && source.id !== target.id) {
            brief.move_piece(source.id, target.id);
            let tactic_function = function() {
                brief.tactic(a_t, source.id, undefined);
                id_to_html.get(source.id).removeEventListener("transitionend", tactic_function);
            };
            id_to_html.get(source.id).addEventListener("transitionend", tactic_function);
        } else {
            brief.tactic(a_t, source.id, undefined);
        }

        return true;
    }

    // 2X. ChangePhase Command
    if (command === speechCommand.ChangePhase) {
        let name = neighbor_word(transcript, "phase", false);
        let number = string_to_int.get(name);
        if (number === undefined) {
            return false;
        }

        brief.change_to_phase(number);
        return true;
    }

    // 2X. Go Back
    if (command === speechCommand.Back) {
        brief.go_forwards_backwards(false);
        return true;
    }

    // 2X. Go Forward
    if (command === speechCommand.Forward) {
        brief.go_forwards_backwards(true);
        return true;
    }

    // 2X. Play
    if (command === speechCommand.Play) {
        let name = neighbor_word(transcript, "phase", false);
        let number = string_to_int.get(name);
        if (number === undefined) {
            if (user_said(transcript, ["beginning"])) {
                brief.piece_to_remove = undefined;
                brief.change_current_state(0);
                brief.dispatchEvent(new Event("view_change", {detail: {current_index: 0}}));
            } else if (!user_said(transcript, ["here"])) {
                return false;
            }
        } else {
            brief.piece_to_remove = undefined;
            brief.change_to_phase(number);
            brief.dispatchEvent(new Event("view_change", {detail: {current_index: number}}));
        }
        brief.play_from_current();
        return true;
    }

    if (user_said(transcript, ["script", "not in army", "not in the army"])) {
        guide_mode(true);
        return true;
    } else if (user_said(transcript, ["instruction"])) {
        guide_mode(false);
        return true;
    }

    return false;
};

// enum for possible commands
speechCommand = {
    Play: -5,
    Back: -4,
    Forward: -3,
    ChangePhase: -2,
    Assign: -1,

    Add: 0,
    Remove: 1,
    Move: 2,

    Attack: 3,
    Support: 4,
    Clear: 5,
    Retain: 6,
    Secure: 7,

};

let process_concurrent = function(transcript) {
    let concurrent_phase = ["in phase", "during phase"];
    let concurrent_time = ["at", "hour", "minute", "hours", "minutes"];

    if (user_said(transcript, concurrent_phase)) {
        let name = neighbor_word(transcript, "phase", false);
        let number = string_to_int.get(name);
        if (number !== undefined && !brief.phases.has(number)) {
            brief.save_current_phase(number);
        }
    }

    let time_match = exact_user_said(transcript, concurrent_time);
    if (time_match !== undefined) {
        let neighbor = neighbor_word(transcript, "at", false);
        if (neighbor === "zero") {
            neighbor = neighbor_word(transcript, "zero", false);
        }
        if (time_match === "at" && !isNaN(neighbor)) {
            set_time(neighbor);
        } else if (time_match !== "at") {
            add_time(transcript);
        }
    }

    update_info();
};

// Helper function to detect if any commands appear in a string
let user_said = function (transcript, commands) {
    for (let i = 0; i < commands.length; i++) {
        if (transcript.indexOf(commands[i]) > -1) {
            return true;
        }
    }
    return false;
};

// ---------------------------------------------------------------------------------------
/*
Return the word the user said, allows for partial strings e.g. "we will go" with "ill" will return "ill"
 */
let specific_user_said = function (transcript, commands) {
    for (let i = 0; i < commands.length; i++) {
        if (transcript.indexOf(commands[i]) > -1) {
            return commands[i];
        }
    }
};

/*
Return the word the user said, does not allow for partial strings e.g. "we will go" with "ill" will return undefined
 */
let exact_user_said = function (transcript, commands) {
    transcript = transcript.split(" ");
    for (let i = 0; i < commands.length; i++) {
        if (transcript.indexOf(commands[i]) > -1) {
            return commands[i];
        }
    }
};


/*
Returns a unit piece with properties based on given transcript
 */
let create_unit = function (transcript) {
    let piece = new Unit();

    piece.size = get_unit_size(transcript);
    if (piece.size === undefined) {
        return undefined;
    }

    piece.friendly = get_friendly(transcript);

    return piece;
};

// Get the names of all possible unit sizes e.g. "battalion", "platoon"
let unit_sizes = [];
for (let val in UnitSize) {
    if (typeof UnitSize[val] === "string") {
        unit_sizes.push(UnitSize[val].toLowerCase());
    }
}
/*
Get the size of the unit or returns undefined if not found
 */
let get_unit_size = function (transcript) {
    let size = specific_user_said(transcript, unit_sizes);

    if (size === false || neighbor_word(transcript, size, true) === undefined) {
        return undefined
    }
    return UnitSize[size[0].toUpperCase() + size.substring(1)];
};

/*
Returns a Place piece to mark an Objective or an ORP
 */
let create_place = function (transcript) {
    let piece = new Place();
    if (user_said(transcript, ["objective rally point"])) {
        piece.type = PlaceType.ORP;
    } else if (user_said(transcript, ["objective"])) {
        piece.type = PlaceType.Objective;
    }

    return piece;
};

/*
Get whether or not the unit is friendly (assumes friendly by default)
 */
let get_friendly = function (transcript) {
    return !user_said(transcript, ["enemy"])
};


/*
Saves the name of a unit to its ID from speech for later reference e.g. "first platoon"
 */
let save_unit = function (transcript, piece) {
    let size = UnitSize[piece.size].toLowerCase();

    let name = neighbor_word(transcript, size, true);

    if (name === undefined) {
        return;
    }
    let identifier = string_to_int.get(name);
    if (identifier !== undefined) {
        let map_back = new Map([["first", "1st"], ["second", "2nd"], ["third", "3rd"],
            ["1st", "first"], ["2nd", "second"], ["3rd", "third"]]);
        let mapped = map_back.get(name);
        if (mapped !== undefined) {
            name_to_id.set(mapped + " " + size, piece.id);
        }
        piece.name = string_to_int.get(name).toString();
        brief.update_all(piece.id, "name", piece.name);
    }

    name_to_id.set(name + " " + size, piece.id);

    if (!name_to_id.has("enemy") && piece.friendly === false) {
        name_to_id.set("enemy", piece.id);
    }

    return name;
};

/*
Check if the unit is already there i.e. don't place a new one with the same name
 */
let already_existing_unit = function(transcript, piece) {
    if (piece.piece_type !== PieceType.Unit) {
        return false;
    }

    let size = UnitSize[piece.size].toLowerCase();

    let name = neighbor_word(transcript, size, true);
    if (name === undefined) {
        return true;
    }

    return name_to_id.get(name + " " + size) !== undefined;
};

/*
Saves a given piece to the internal name mapping of speech to pieces
 */
let save_place = function (transcript, piece) {
    let name;
    if (piece.type === PlaceType.Objective) {
        let label = "objective";
        name = label + " " + neighbor_word(transcript, label, false);
        piece.name = name;
    } else if (piece.type === PlaceType.ORP) {
        name = "objective rally point";
        piece.name = "orp"
    }

    name_to_id.set(name, piece.id);
    return name;
};

/*
Takes a neighboring word either before or after
 */
let neighbor_word = function (transcript, keyword, prior = true) {
    if (!user_said(transcript, [keyword])) {
        return undefined
    }

    let split = transcript.split(" ");
    let index = split.indexOf(keyword);

    let direction;
    if (prior === true) {
        direction = -1
    } else {
        direction = 1;
    }

    return split[index + direction];
};

/*
Get the ID of a unit saved by save_piece from speech
Naively takes the first piece described
 */
let get_source = function (transcript) {
    let names = [];
    for (let [k, v] of name_to_id) {
        names.push(k);
    }
    let match = forwards_user_said(transcript, names);
    if (match === undefined) {
        return undefined;
    }

    return {name: match, id: name_to_id.get(match)};
};

/*
Get the ID of a unit saved by save_piece from speech or if the user is designating a point
Naively takes the last piece described
 */
let get_target = function (transcript) {
    let names = [];
    for (let [k, v] of name_to_id) {
        names.push(k);
    }
    names.push("here");
    names.push("hear");
    let match = backwards_user_said(transcript, names);
    // target is designated by Leap
    if (match === "here" || match === "hear") {
        let point = handle_here_point();
        if (point === undefined) {
            return undefined;  // TODO: handle invalid location better (or fix elsewhere)
        }
        return {name: undefined, id: point.id};
    }

    return {name: match, id: name_to_id.get(match)};
};

/*
Returns the first match in the order of commands
 */
let forwards_user_said = function (transcript, commands) {
    let lowest_i = Infinity;
    let lowest = undefined;
    for (let i = 0; i < commands.length; i++) {
        let index = transcript.indexOf(commands[i]);
        if (index > -1 && index < lowest_i) {
            lowest_i = index;
            lowest = commands[i]
        }
    }
    return lowest
};

/*
Returns the last match in the order of commands
 */
let backwards_user_said = function (transcript, commands) {
    let highest_i = -Infinity;
    let highest = undefined;
    for (let i = 0; i < commands.length; i++) {
        let index = transcript.indexOf(commands[i]);
        if (index > -1 && index > highest_i) {
            highest_i = index;
            highest = commands[i]
        }
    }
    return highest
};

/*
If the user is pointing on the board, makes a Point piece there and returns it
 */
let handle_here_point = function () {
    let point = new Place();
    point.type = PlaceType.Point;

    let coords = get_board_coordinates();
    if (coords === undefined) {
        return undefined;
    }
    point.coordinates = coords;

    brief.add_piece(point);
    return point;
};

/*
If the user said we, returns a list of all friendly units
 */
let handle_we = function (transcript) {
    if (!user_said(transcript, ["we"])) {
        return undefined;
    }

    let friendlies = [];
    for (let [k, v] of brief.current.pieces) {
        if (v.constructor.name === "Unit" && v.friendly) {
            friendlies.push(v.id);
        }
    }

    return friendlies;
};

/*
Sets the time from raw speech
 */
let set_time_assign = function (transcript) {
    let spoken_time = neighbor_word(transcript, "is", false);
    if (spoken_time === "now") {
        spoken_time = neighbor_word(transcript, "now", false);
    }
    if (spoken_time === "0") {
        spoken_time = neighbor_word(transcript, "0", false);
    }
    if (spoken_time === undefined) {
        return;
    }

    set_time(spoken_time);
};

/*
Sets the time from the specific time string
 */
let set_time = function (time_string) {
    let hours, minutes;
    if (time_string.length === 1) {
        hours = "0" + time_string;
        minutes = "00";
    } else if (time_string.length === 2) {
        hours = time_string;
        minutes = "00";
    } else if (time_string.length === 3) {
        hours = "0" + time_string.charAt(0);
        minutes = time_string.substring(1);
    } else if (time_string.length === 4) {
        hours = time_string.substring(0, 2);
        minutes = time_string.substring(2);
    }

    brief.set_current_time(parseInt(hours), parseInt(minutes));
};

/*
Add time given a transcript describing how many minutes and hours
 */
let add_time = function (transcript) {
    let hours = neighbor_word(transcript, "hour", true);

    if (hours === "an") {
        hours = 1;
    } else {
        hours = parseInt(hours);
    }
    if (hours === undefined || isNaN(hours)) {
        hours = 0;
    }

    let minutes = neighbor_word(transcript, "minute", true);
    if (isNaN(minutes)) {
        minutes = string_to_int.get(minutes);
    } else {
        minutes = parseInt(minutes);
    }
    if (minutes === undefined || isNaN(minutes)) {
        minutes = 0;
    }
    if (hours === 0 && minutes === 0) {
        return;
    }

    brief.add_current_time(hours, minutes);
};

/*
Convert a number in string form with variations (1st, first, 1) into the integer form (1)
 */
let name_to_number = function (name) {
    let separated = name.split(" ");

    for (let word of separated) {
        if (string_to_int.has(word)) {
            return string_to_int.get(word).toString();
        }
    }
    return undefined;
};

/*
Parse the distance and direction information from raw speech
 */
let get_distance_direction = function (transcript) {
    let distance, direction;

    let cardinal = new Map([["north", 0], ["south", 180], ["east", 90], ["west", 270]]);
    let said = specific_user_said(transcript, ["north", "south", "east", "west"]);
    if (said !== undefined) {
        direction = cardinal.get(said);
    } else {
        if (!user_said(transcript, ["degree"])) {
            return false;
        }
        said = neighbor_word(transcript, "degree");
        if (said === undefined) {
            return undefined;
        }

        if (string_to_int.has(said)) {
            direction = string_to_int.get(said);
        } else {
            direction = parseInt(said);
            if (isNaN(direction)) {
                return undefined;
            }
        }
    }

    said = neighbor_word(transcript, "m");
    if (said === undefined) {
        said = neighbor_word(transcript, "meters");
    }
    if (said === undefined) {
        return undefined;
    }

    if (string_to_int.has(said)) {
        distance = string_to_int.get(said);
    } else {
        distance = parseInt(said);
        if (isNaN(direction)) {
            return undefined;
        }
    }

    return {distance: distance, direction: direction};
};

/*
Reverse map lookup of a piece's referred name given its id
 */
let id_to_name = function(id) {
    for (let name of name_to_id.keys()) {
        if (name_to_id.get(name) === id) {
            return name;
        }
    }
    return undefined;
};