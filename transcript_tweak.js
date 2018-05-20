/*
Makes string substitutions to preprocess raw transcript for better processing within processing_speech.js
Also handles references using "this" and "that"
 */
let transcript_tweak = function(inter) {
    let dict_mapping = [
        // misinterpretation
        [" hear", " here"],

        ["for squad", "first squad"],
        [" quad", " squad"],
        ["splatoon", "platoon"],
        ["cartoon", "platoon"],

        ["an army", "enemy"],
        ["army squad", "enemy squad"],
        ["in army squad", "enemy squad"],
        ["enemies", "enemy"],
        ["anna ", "enemy "],
        ["amy ", "enemy "],
        ["find me", "enemy"],

        ["fever", "beaver"],
        ["bieber", "beaver"],
        ["subjective", "objective"],

        ["secour", "secure"],
        [" crip", " script"],
        ["destruction", "instruction"],

        ["-degree", "degree"],
        ["°", " degree"],
        ["degrees", "degree"],
        ["degreez", "degree"],
        ["to degree", "2 degree"],

        ["808 31st", "at 0830 first"],
        ["808 32st squad", "at 0830 second"],
        ["for a squad", "first squad"],
        ["this one", "this unit"],


        ["m2", "m to"],
        ["add", "at"],
        [":", ""],
        ["834", "830 first"],
        ["minutes", "minute"],
        ["hours", "hour"],
        [" 0 ", " 0"],
        [" zero ", " 0"],

        ["suppressor", "suppressing"],


        // expansion
        ["orp", "objective rally point"],
        ["zero", "0"],
        ["there", "here"],
    ];
    check_highlight(inter);

    let this_unit = sub_this_that(inter, "this");
    if (this_unit !== undefined) {
        inter = inter.replace(this_unit.old_name, this_unit.new_name);
    }
    let that_unit = sub_this_that(inter, "that");
    if (that_unit !== undefined) {
        inter = inter.replace(that_unit.old_name, that_unit.new_name);
    }

    let dictionary = new Map(dict_mapping);

    for (let sub of dictionary.keys()) {
        inter = inter.replace(sub, pad(dictionary.get(sub)));
    }

    return inter;
};

/*
Add spaces around a word
 */
let pad = function(word) {
    let special = new Set(["-", "°"]);
    if (special.has(word.charAt(0))) {
        return " " + word;
    }

    return word;
};

let saved_ids = {"this": undefined, "that": undefined};

/*
Replace units referred by this and that into their actual names
 */
let sub_this_that = function(inter, this_or_that) {
    let names = [this_or_that + " unit"];
    for (let size of unit_sizes) {
        names.push(this_or_that + " " + size);
    }
    let match = forwards_user_said(inter, names);
    if (match === undefined) {
        return undefined;
    }

    let size = match.split(" ")[1];
    size = size.charAt(0).toUpperCase() + size.substring(1);
    let piece_id = piece_intersecting_cursor();

    if (saved_ids[this_or_that] === undefined && piece_id !== undefined) {
        saved_ids[this_or_that] = piece_id;
    }

    let piece = brief.current.pieces.get(saved_ids[this_or_that]);
    if (piece === undefined || (size !== "Unit" && piece.size !== UnitSize[size])) {
        return undefined;
    }

    let div = id_to_html.get(saved_ids[this_or_that]);
    highlighting.push(div);
    div.classList.add("selected-" + this_or_that);


    return {new_name: id_to_name(saved_ids[this_or_that]), old_name: this_or_that + " " + size.toLowerCase()};
};

let timer;
/*
Check if the UI should be highlighting words and if not, set a timer to clear the highlighting
 */
let check_highlight = function(transcript) {
    if (transcript.indexOf("this") < 0 && transcript.indexOf("that") < 0) {
        timer = setTimeout(function() {
            clear_highlight()
        }, 2000);
    } else {
        clearTimeout(timer);
    }
};

/*
Clears highlighting of units referred to as this and that
 */
let clear_highlight = function() {
    for (let div of highlighting) {
        div.classList.remove("selected-this");
        div.classList.remove("selected-that");
    }
    highlighting = [];
};