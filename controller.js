/*
This represents the frontend with view.css and index.html

View (browser) is updated on an event-by-event basis. The model will send an event when changed, the controller (this)
will listen for it and update the view accordingly.
 */

// references to various sections of HTML (including new ones initialized via this file)
let dom = {};

// Brief object that serves as backend model
let brief = new Brief();

// Map: Piece IDs to HTML elements in the HTML
let id_to_html = new Map();
let shadows = [];

// List of actions currently taking place
let actions = [];

// on initialization
document.addEventListener("DOMContentLoaded", function () {
    dom.title = document.getElementsByClassName("operation-title")[0];
    dom.time = document.getElementsByClassName("time")[0];
    dom.phase = document.getElementsByClassName("phase")[0];
    dom.map = document.getElementsByClassName("map")[0];
    dom.cursor = document.getElementsByClassName("cursor")[0];
    dom.pieces = document.getElementsByClassName("pieces")[0];
    dom.actions = document.getElementsByClassName("actions")[0];
    dom.guide = document.getElementsByClassName("guide")[0];
    dom.current_guide_mode = document.getElementsByClassName("instructions")[0];

    dom.cursor.classList.add("cursor");

    guide_mode(false);
    //
    // let a = new Unit();
    // a.size = UnitSize.Platoon;
    // a.friendly = true;
    // a.coordinates = [100, 100];
    // let b = new Unit();
    // b.size = UnitSize.Squad;
    // b.friendly = false;
    // b.coordinates = [200, 400];
    // let c = new Place();
    // c.type = PlaceType.ORP;
    // c.coordinates = [400, 200];
    // let d = new Place();
    // d.type = PlaceType.Point;
    // d.coordinates = [100, 200];
    //
    // brief.add_piece(a);
    // brief.add_piece(b);
    // brief.add_piece(c);
    // brief.add_piece(d);
    //
    // a.name = "1";
    // update_name(a);
    // c.name = "objective python";
    // update_name(c);
    //
    // processSpeech("welcome to operation big dog");
    //
    // processSpeech("this is phase one");
    // processSpeech("time is now 800");
    //
    // setTimeout(function () {
    //     brief.move_piece(0, 2, 20, 100);
    // }, 500);
    //
    // setTimeout(function () {
    //     processSpeech("in phase two after 30 minutes");
    //     brief.tactic(ActionType.Support, 0, 1);
    // }, 1000);
    //
    // setTimeout(function () {
    //     brief.remove_piece_initiate(1)
    // }, 1500);
    //
    // setTimeout(function () {
    //     brief.move_piece(0, 3, 90, 100);
    // }, 2000);
    //
    // setTimeout(function () {
    //     brief.tactic(ActionType.Secure, 0, undefined);
    // }, 2500);
    //
    // setTimeout(function () {
    //     brief.move_piece(0, 3, 90, 100);
    // }, 2000);
    //
    // setTimeout(function () {
    //     processSpeech("go back to phase one");
    // }, 2500);
    //
    // setTimeout(function () {
    //     processSpeech("play from here");
    // }, 3000);
    //
    // setTimeout(function () {
    //     processSpeech("play from the beginning");
    // }, 9000);


});

brief.addEventListener("view_change", function () {
    clear_pieces();
    clear_actions();

    for (let piece of brief.current.pieces.values()) {
        add_piece(piece);
        update_name(piece);
    }
    for (let action of brief.actions[brief.current_index]) {
        if (action.type === ActionType.Move) {
            add_move_arrow(action);
        } else if (action.type === ActionType.Remove) {
            add_remove_x(action);
        } else if (tactics.has(action.type)) {
            add_tactic(action);
        }
    }
    update_info();
});

brief.addEventListener("add", function (event) {
    clear_actions();
    add_piece(event.detail.piece);
    update_name(event.detail.piece);
    update_info();
});

brief.addEventListener("remove", function (event) {
    // clear_actions();
    add_remove_x(event.detail.action);
    update_info();
});

brief.addEventListener("move", function (event) {
    let action = event.detail.action;
    clear_actions();

    add_move_arrow(action);

    allow_animation(id_to_html.get(event.detail.piece_id));
    update_piece_location(event.detail.piece_id);

    update_info();
});

brief.addEventListener("tactic", function (event) {
    let action = event.detail.action;
    clear_actions(true);
    add_tactic(action);
    update_info();
});

let refresh_to_current = function () {
    let current = brief.current;
    for (let piece of current.pieces.values()) {
        add_piece(piece)
    }

    for (let id of id_to_html) {
        update_piece_location(id)
    }
};

let add_piece = function (piece) {
    let element = id_to_html.get(piece.id);
    if (element === undefined) {
        // create HTML element based on PieceType
        if (piece.piece_type === PieceType.Unit) {
            element = unit_html(piece);
        } else if (piece.piece_type === PieceType.Place) {
            element = place_html(piece);
        } else {
            element = leader_html(piece);
        }

        dom.pieces.appendChild(element);  // add_piece to HTML file
        id_to_html.set(piece.id, element);  // add_piece to reference dictionary
    }

    update_piece_location(piece.id);
};

let unit_html = function (piece) {
    let filename = "graphics/";
    filename = filename + "infantry";
    filename = filename + "-" + UnitSize[piece.size].toLowerCase();

    if (piece.friendly) {
        filename = filename + "-friendly";
    } else {
        filename = filename + "-enemy";
    }
    filename = filename + ".svg";

    let holder = document.createElement("div");
    let image = document.createElement("img");
    let label = document.createElement("div");
    holder.appendChild(image);
    holder.appendChild(label);

    image.setAttribute("src", filename);
    holder.classList.add("unit");
    image.classList.add("unit-image");
    label.classList.add("unit-label");

    return holder;
};

let place_html = function (piece) {
    let holder = document.createElement("div");
    let image = document.createElement("img");
    let label = document.createElement("div");
    holder.appendChild(image);
    holder.appendChild(label);

    image.setAttribute("src", "graphics/" + PlaceType[piece.type].toLowerCase() + ".svg");
    if (piece.type === PlaceType.Point) {
        holder.classList.add("point");
        label.classList.add("place-label");
    } else if (piece.type === PlaceType.Objective) {
        holder.classList.add("objective");
        label.classList.add("place-label");
    } else if (piece.type === PlaceType.ORP) {
        holder.classList.add("objective");
        label.classList.add("orp-label");
    }
    image.classList.add("place-image");

    dom.pieces.appendChild(holder);
    return holder;
};

let leader_html = function (piece) {
    let image = document.createElement("img");

    image.classList.add("piece");
    dom.pieces.appendChild(image);

    return image;
};

let update_piece_location = function (piece_id) {
    let holder = id_to_html.get(piece_id);
    if (holder === undefined) {  // piece not found at all
        return
    }

    let coordinates = offset_coordinates_from_id(piece_id);
    if (coordinates === undefined) {  // piece not found in current Board
        holder.style.setProperty("display", "none");  // hide it
        return
    }

    holder.style.setProperty("--left", coordinates[0] + "px");
    holder.style.setProperty("--top", coordinates[1] + "px");
    holder.style.setProperty("display", "block");  // show it
    animate_in(holder);
};

let add_tactic = function (action) {
    let targeted = true;
    if (action.target === undefined) {
        targeted = false;
    }

    let tactic = ActionType[action.type].toLowerCase();

    let holder = document.createElement("div");
    let image = document.createElement("img");
    holder.appendChild(image);
    image.setAttribute("src", "graphics/" + tactic + ".svg");
    image.classList.add("action-image");
    dom.actions.appendChild(holder);

    actions.push(holder);

    if (targeted) {
        holder.classList.add("targeted-action");
        update_targeted_action_location(action, holder);
    } else {
        holder.classList.add("untargeted-action");
        update_untargeted_action_location(action, holder);
    }
};

let update_targeted_action_location = function (action, image) {
    let source_loc = offset_coordinates(brief.current.pieces.get(action.source).coordinates);
    let target_loc = offset_coordinates(brief.current.pieces.get(action.target).coordinates);

    let diff_y = target_loc[1] - source_loc[1];
    let diff_x = target_loc[0] - source_loc[0];

    let rotation = Math.atan2(diff_y, diff_x) + Math.PI / 2;
    image.style.setProperty("--rotate", rotation + "rad");

    let shift = 100;
    let shift_x = source_loc[0] + Math.min(shift, Math.abs(diff_x / 2)) * Math.sign(diff_x);
    let shift_y = source_loc[1] + Math.min(shift, Math.abs(diff_y / 2)) * Math.sign(diff_y);

    image.style.setProperty("--left", shift_x + "px");
    image.style.setProperty("--top", shift_y + "px");
    animate_in(image);
};

let update_untargeted_action_location = function (action, image) {
    let source_loc = offset_coordinates(brief.current.pieces.get(action.source).coordinates);

    image.style.setProperty("--left", source_loc[0] + "px");
    image.style.setProperty("--top", source_loc[1] + "px");
    animate_in(image);
};

let add_move_arrow = function (action) {
    let holder = document.createElement("div");
    let image = document.createElement("img");
    let label = document.createElement("div");
    holder.appendChild(image);
    holder.appendChild(label);

    image.setAttribute("src", "graphics/move.svg");
    setup_label(action, label);
    holder.classList.add("move");
    image.classList.add("move-image");
    label.classList.add("move-label");

    dom.actions.appendChild(holder);

    actions.push(holder);

    clear_highlight();
    update_move_location(action, holder);
    move_shadow(action);
    animate_in(holder);
};

let setup_label = function (action, label) {
    if (action.distance === undefined || action.direction === undefined) {
        return
    }
    label.innerHTML = "<span class=\"move-label-text\">" +
        action.direction.toString() + String.fromCharCode(176) + " " + action.distance.toString() + "m" + "</span>";
};

let update_move_location = function (action, image) {
    let source_loc = offset_coordinates(brief.states[brief.current_index - 1]
        .pieces.get(action.source).coordinates);
    let target_loc = offset_coordinates(brief.current.pieces.get(action.target).coordinates);

    let diff_y = target_loc[1] - source_loc[1];
    let diff_x = target_loc[0] - source_loc[0];

    // let arrow_offset = 50;
    let arrow_length = Math.sqrt(Math.pow(diff_y, 2) + Math.pow(diff_x, 2));
    image.style.setProperty("--width", arrow_length + "px");  // set size of the arrow

    let rotation = Math.atan2(diff_y, diff_x) + Math.PI / 2;
    image.style.setProperty("--rotate", rotation + "rad");

    // center the action halfway between the two
    let center_x = source_loc[0] + diff_x / 2;
    let center_y = source_loc[1] + diff_y / 2;

    // adjust for arrow offset (aligned via left)
    image.style.setProperty("--left", center_x + "px");
    image.style.setProperty("--top", center_y + "px");
    animate_in(image);
};

let move_shadow = function (action) {
    let source_loc = offset_coordinates(brief.states[brief.current_index-1]
        .pieces.get(action.source).coordinates);
    let image = id_to_html.get(action.source);

    let copy = image.cloneNode(true);
    copy.classList.add("shadow");
    copy.classList.remove("selected-this");
    copy.classList.remove("selected-that");
    copy.style.setProperty("--left", source_loc[0] + "px");
    copy.style.setProperty("--top", source_loc[1] + "px");

    dom.pieces.appendChild(copy);
    shadows.push(copy);
};

let add_remove_x = function (action) {
    let image = document.createElement("img");
    image.setAttribute("src", "graphics/remove.svg");
    image.classList.add("remove-x");
    dom.actions.appendChild(image);

    actions.push(image);

    update_remove_location(action, image);
};

let update_remove_location = function (action, image) {
    let removed_piece_image = id_to_html.get(action.source);
    let rects = removed_piece_image.getClientRects()[0];
    let source_loc = [rects.x, rects.y];

    image.style.setProperty("--left", source_loc[0] + "px");
    image.style.setProperty("--top", source_loc[1] + "px");
    animate_in(image);
};

let offset_coordinates_from_id = function (piece_id) {
    let piece = brief.current.pieces.get(piece_id);
    if (piece === undefined) {
        return undefined
    }

    return offset_coordinates(piece.coordinates)
};

let offset_coordinates = function (coordinates) {
    let map_origin = dom.map.getClientRects()[0];
    map_origin = [map_origin.x, map_origin.y];

    return [map_origin[0] + coordinates[0], map_origin[1] + coordinates[1]]
};

let remove_offset_coordinates = function (coordinates) {
    let map_origin = dom.map.getClientRects()[0];
    map_origin = [map_origin.x, map_origin.y];

    return [coordinates[0] - map_origin[0], coordinates[1] - map_origin[1]]
};

let tactics_set = new Set(["attack", "secure", "support"]);
let clear_actions = function (keep_tactics=false) {
    let keep = [];
    A: for (let act of actions) {
        if (keep_tactics) {
            for (let t of tactics_set) {
                if (act.childNodes[0].src.indexOf(t) >= 0) {
                    keep.push(act);
                    continue A;
                }
            }
        }
        act.remove();
    }
    actions = keep;

    for (let sha of shadows) {
        sha.remove();
    }
    shadows = [];
};

let clear_pieces = function () {
    for (let id of id_to_html.keys()) {
        id_to_html.get(id).remove();
    }
    id_to_html.clear();
};

let update_info = function() {
    update_phase();
    update_time();
};

let update_phase = function() {
    let element = document.getElementsByClassName("phase")[0];
    let phase = brief.current.phase;
    if (phase === undefined) {
        phase = "0"
    }
    element.innerHTML = "Phase " + phase.toString();
};

let update_time = function() {
    let element = document.getElementsByClassName("time")[0];
    let time = brief.current.time;

    if (time === undefined) {
        time = "----";
    } else {
        let hours = time.getUTCHours().toString();
        if (hours.length === 1) {
            hours = "0" + hours;
        }
        let minutes = time.getUTCMinutes().toString();
        if (minutes.length === 1) {
            minutes = "0" + minutes;
        }
        time = hours + minutes;
    }
    element.innerHTML = time;
};

let update_mission_name = function() {
    let element = document.getElementsByClassName("operation-title")[0];
    let name = brief.mission_name.replace(/\w\S*/g,
        function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});

    element.innerHTML = "Operation " + name;
};

let update_name = function(piece) {
    let element = id_to_html.get(piece.id);
    if (piece.name === undefined) {
        return;
    }
    let label = piece.name.toUpperCase();
    element.childNodes[1].innerHTML = label;
};

let allow_animation = function(element) {
    element.classList.add("animate-move");

    element.addEventListener("transitionend",
        function() {
            element.classList.remove("animate-move");
        }
    );
};

let animate_in = function(element) {
    element.classList.add("fadein");

    element.addEventListener("animationend",
        function() {
            element.classList.remove("fadein");
        }
    );
};

let animate_out = function(piece_id) {
    let element = id_to_html.get(piece_id);
    element.classList.add("fadeout");

    element.addEventListener("animationend",
        function() {
            element.remove();
        }
    );
};

let guide_mode = function(view_script) {
    if (view_script) {
        dom.current_guide_mode = document.getElementsByClassName("script")[0];
        document.getElementsByClassName("script")[0].classList.remove("off");
        document.getElementsByClassName("script-button")[0].classList.add("off");
        document.getElementsByClassName("instructions")[0].classList.add("off");
        document.getElementsByClassName("instructions-button")[0].classList.remove("off");
    } else {
        dom.current_guide_mode = document.getElementsByClassName("instructions")[0];
        document.getElementsByClassName("script")[0].classList.add("off");
        document.getElementsByClassName("script-button")[0].classList.remove("off");
        document.getElementsByClassName("instructions")[0].classList.remove("off");
        document.getElementsByClassName("instructions-button")[0].classList.add("off");
    }

};