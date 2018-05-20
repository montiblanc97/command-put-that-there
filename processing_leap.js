let LEAPSCALE = 0.6;

let cursor_position = [0, 0];
let scrolling = false;

Leap.loop({
    hand: function (hand) {
        // set the cursor to where the user's hand is
        cursor_position = [hand.screenPosition()[0], hand.screenPosition()[1] + 400];  // 400 seemed to center better
        set_cursor_position(cursor_position);

        // Check if user is making first for scrolling
        if (hand.grabStrength < 0.99) {
            scrolling = false;
            dom.cursor.classList.remove("scrolling");
            return;
        }
        if (on_guide()) {
            scrolling = true;
            dom.cursor.classList.add("scrolling");
        }
        if (scrolling) {
            scroll(hand.palmVelocity);
        }
    }
}).use('screenPosition', {scale: LEAPSCALE});

/*
Set the cursor to a given location on the screen
 */
let set_cursor_position = function(screen_coords) {
    dom.cursor.style.setProperty("--left", screen_coords[0] + "px");
    dom.cursor.style.setProperty("--top", screen_coords[1] + "px");
};

/*
Return whether or not the user's hand is over the guide (instructions/script) on the UI
 */
let on_guide = function() {
    let box = dom.guide.getClientRects()[0];
    let x = cursor_position[0];
    let y = cursor_position[1];

    if (x > box.left && x < box.right && y > box.top && y < box.bottom) {
        return true;
    } else {
        return false;
    }
};

/*
Scroll the guide
 */
let scroll = function(velocity) {
    let y_velocity = velocity[1];
    y_velocity = y_velocity / 9;
    dom.current_guide_mode.scrollBy(0, y_velocity);
};

/*
Gets the piece that the cursor is over
 */
let piece_intersecting_cursor = function() {

    let closest = undefined;
    let closest_distance = 50;  // anything more than 50 pixels away shouldn't be considered
    for (let piece of brief.current.pieces.values()) {
        let offset = offset_coordinates(piece.coordinates);
        let dist_x = offset[0] - cursor_position[0];
        let dist_y = offset[1] - cursor_position[1];
        let distance = Math.sqrt(Math.pow(dist_x, 2) + Math.pow(dist_y, 2));

        if (distance < closest_distance) {
            closest = piece;
            closest_distance = distance;
        }
    }
    if (closest === undefined) {
        return undefined;
    }

    return closest.id;
};

/*
Gets the coordinates of the cursor relative to the actual board/grid/map and not the entire screen
 */
let get_board_coordinates = function() {
    let map_size = dom.map.getClientRects()[0];
    let coords = remove_offset_coordinates(cursor_position);
    if (coords[0] < 0 || coords[0] > map_size.right || coords[1] < 0 || coords[1] > map_size.bottom) {
        return undefined;
    }
    return coords;
};