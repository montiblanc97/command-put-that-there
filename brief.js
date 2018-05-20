/*
This represents the entire backend

A mission brief from start to finish that contains various board states, actions between each state,
and the current state the brief is on.

briefer: the Leader piece representing the person briefing
states: the various Board states of the brief
actions: corresponding Actions in between each state, actions[i] are the actions between states[i-1] and states[i]
references: between String names and Piece IDs
current: the current Board state of the brief
last_piece: that was referred to, for use with "it, they"
setup: True to include new actions as changes to the current state, False as new states.
    Example use is on initializing pieces on the board i.e. each addition of a piece shouldn't be recorded as a state
setup_states: holds intermediate states to allow undo history during setup
 */
class Brief extends EventTarget{


    constructor() {
        super();

        this.unique_id = 0;  // so pieces wouldn't have the same piece id

        this.briefer = undefined;  // the Leader piece ID
        this.mission_name = undefined;

        this.states = [];  // board objects representing different states of mission in order
        this.actions = [[]];  // arrays of actions corresponding to the changes between each state

        this.last_piece = undefined;
        this.setup_states = [];

        this.setup = false;  // whether or not system is in setup mode (don't record new actions)
        this.current = new Board();  // the current Board object
        this.states.push(this.current);
        this.current_index = 0;  // the index of the current Board object in this.states

        this.start_time = undefined;  // the start time of the mission overall
        this.went_back = false;  // whether or not the user just commanded "go back"
        // if user went back to correct error, all future boards prior to correction should be deleted

        // Map: Phase to index of first state of phase
        this.phases = new Map([[0, 0]]);

        // boolean to track which piece is being removed
        // removing a piece is in two stages (designate removal, actually remove)
        this.piece_to_remove = undefined;
        // used when playing (since states aren't saved, just iterated through)
        this.playing_piece_to_remove = undefined;
    }

    set_setup(on) {
        this.setup = on;
    }

    /*
    Updates a piece's attributes for all the states in this brief
     */
    update_all(piece_id, key, value) {
        for (let board of this.states) {
            board.update(piece_id, key, value)
        }
    }

    /*
    Wipes the Action history of the current Board for all actions with the same values as the parameters
    Undefined parameters means that property is ignored
     */
    clear_action(type, source, target) {
        let current_actions = this.actions[this.current_index];
        for (let i = 0; i < current_actions.length; i++) {
            let action = current_actions[i];
            if ((type === undefined || action.type === type) &&
                (source === undefined || action.source === source) &&
                (target === undefined || action.target === target)) {
                this.actions[this.current_index].splice(i, 1);
                i--;
            }
        }
    }

    /*
    Change the current state of the brief i.e. show a different board in the history of states
     */
    change_current_state(index) {
        if (index < 0 || index > this.states.length) {
            throw "Given index " + index + "not valid index of states"
        }
        this.current = this.states[index];
        this.current_index = index;

        this.remove_piece_finish();
    }

    /*
    Change the current state to be the latest saved one
     */
    change_to_last_state() {
        this.change_current_state(this.states.length - 1);
    }

    /*
    Add a piece to the current state, saving it as a new state, and update the new state as the current state
     */
    add_piece(piece) {
        // don't worry about properties, just add_piece blank piece to board, as long as ID is correct
        this.clear_future();
        piece.id = this.unique_id;
        this.unique_id ++;  // increment to keep unique

        let next_state = this.current.add(piece);

        if (this.setup) {  // setting up, just change state
            this.current = next_state;
            this.clear_action(ActionType.Remove, piece.id, undefined);
            if (this.actions.length === 0) {  // start new sequence
                this.actions.push([new Action(ActionType.Add, piece.id, undefined)])
            } else {  // add_piece to last entry for actions
                this.actions[this.actions.length - 1].push(new Action(ActionType.Add, piece.id, undefined))
            }
        } else {
            this.states.push(next_state);
            this.actions.push([new Action(ActionType.Add, piece.id, undefined)]);
            this.change_to_last_state();
        }
        this.dispatchEvent(new CustomEvent("add", {detail: {piece: piece}}));
        this.update_current_info();

        return piece.id;
    }

    /*
    Same as add_piece but for removing. Note that remove is done in two stages, the initial command first signals,
    then the action after that actually has the piece gone
    This is the signal part
     */
    remove_piece_initiate(piece_id) {
        if (!this.current.pieces.has(piece_id)) {  // piece doesn't exist on current board
            return;
        }
        this.clear_future();

        let action;
        if (this.setup) {
            this.current = this.current.remove(piece_id);
            this.clear_action(ActionType.Add, piece_id, undefined);
            action = undefined;
        } else {
            this.states.push(this.current);
            action = new Action(ActionType.Remove, piece_id, undefined);
            this.actions.push([action]);
            this.change_to_last_state();
            this.piece_to_remove = piece_id;
        }
        this.update_current_info();
        this.dispatchEvent(new CustomEvent("remove", {detail: {piece_id: piece_id, action: action}}))
    }

    /*
    The actual removal part of the two-stage remove
     */
    remove_piece_finish() {
        if (this.piece_to_remove === undefined) {
            return;
        }

        let next_state = this.current.remove(this.piece_to_remove);
        if (next_state === undefined) {
            throw "second part of remove: tried to remove piece but it wasn't there"
        }
        this.states[this.current_index] = next_state;
        this.current = next_state;
        // removes without corresponding action (which is in previous one)

        animate_out(this.piece_to_remove);
        this.piece_to_remove = undefined;
    }

    /*
    Same as add_piece but for moving pieces around. An optional direction and distance can be specified
    Note that moving can only be between two known places (elsewhere handles "here" which saves a new point on board)
     */
    move_piece(piece_id, location_id, direction=undefined, distance=undefined) {
        let old_loc = this.current.pieces.get(piece_id).coordinates;
        let new_loc = this.current.pieces.get(location_id).coordinates;
        if (old_loc === new_loc) {
            return;
        }
        let next_state = this.current.move(piece_id, location_id);

        if (next_state === undefined) {  // not found on Board
            return
        }
        this.clear_future();

        let action = undefined;
        if (this.setup) {
            this.current = next_state;  // don't need to add_piece action since Actions don't track coordinates
        } else {
            this.states.push(next_state);
            action = new Action(ActionType.Move, piece_id, location_id);
            action.direction = direction;
            action.distance = distance;
            this.actions.push([action]);
            this.change_to_last_state();
        }
        this.update_current_info();
        this.dispatchEvent(new CustomEvent("move", {detail: {piece_id: piece_id, location_id: location_id,
            from: old_loc, to: new_loc, action: action}}))
    }

    /*
    Same as add_piece but for designating tactics
     */
    tactic(type, piece_id, location_id) {
        if (this.setup) {  // don't support during setup (may change later)
            return
        }
        this.clear_future();
        let old_loc = this.current.pieces.get(piece_id).coordinates;
        let new_loc;
        if (location_id !== undefined) {
            new_loc = this.current.pieces.get(location_id).coordinates;
        } else {
            new_loc = undefined;
        }


        this.states.push(this.current.copy());
        let action = new Action(type, piece_id, location_id);
        this.actions.push([action]);
        this.change_to_last_state();
        this.update_current_info();

        this.dispatchEvent(new CustomEvent("tactic", {detail: {action: action,
                piece_id: piece_id, location_id: location_id, from: old_loc, to: new_loc}}))
    }

    /*
    Save the current index as the start of a phase
     */
    save_current_phase(phase_number) {
        this.phases.set(phase_number, this.current_index);
        this.current.phase = phase_number;
    }

    /*
    Change the board to the start of a given phase
     */
    change_to_phase(phase_number) {
        this.change_current_state(this.phases.get(phase_number));
        this.dispatchEvent(new CustomEvent("view_change", {detail: {current_index: this.current_index}}))
    }

    /*
    Makes the current board's phase the same as the one prior to it
     */
    update_current_phase() {
        if (this.current.phase !== undefined) {
            return;
        }
        this.current.phase = this.states[this.current_index-1].phase;
    }

    /*
    Sets the time of the current board and also the start time of the entire mission if it's the first time given
     */
    set_current_time(hours, minutes) {
        this.current.time = new Date(3600000 * hours + 60000 * minutes);
        if (this.start_time === undefined) {
            this.start_time = this.current.time;
        }
    }

    /*
    Sets the time of the current board the same as the one prior to it
     */
    update_current_time() {
        if (this.current.time !== undefined) {
            return;
        }
        this.current.time = this.states[this.current_index-1].time;
    }

    /*
    Add time (in hours and minutes) to the current board's time
     */
    add_current_time(hours, minutes) {
        if (this.start_time === undefined) {
            this.set_current_time(0, 0);
        } else {
            this.current.time = new Date(this.current.time.getTime() + 3600000 * hours + 60000 * minutes);
        }
    }

    /*
    Sets the current board's time and phase to those of the prior state
     */
    update_current_info() {
        this.update_current_phase();
        this.update_current_time();
    }

    /*
    Set the name of the mission
     */
    set_mission_name(name) {
        this.mission_name = name;
        update_mission_name();
    }

    /*
    Go to the previous or next board state
     */
    go_forwards_backwards(forwards=true) {
        let change;
        if (forwards === true) {
            change = 1;
        } else {
            change = -1;
        }
        let new_index = this.current_index + change;
        if (new_index < 0 || new_index > this.states.length - 1) {
            return;
        }
        if (forwards) {
            this.go_forwards();
        }
        else {  // going backwards
            this.went_back = true;
            this.change_current_state(new_index);
            for (let action of this.actions[this.current_index]) {
                let name = ActionType[action.type].toLowerCase();
                if (name === "remove") {
                    this.playing_piece_to_remove = action.source;
                }
            }
            this.dispatchEvent(new CustomEvent("view_change", {detail: {current_index: this.current_index}}))
        }
    }

    /*
    Go to the next board state
     */
    go_forwards() {
        this.change_current_state(this.current_index + 1);
        if (this.playing_piece_to_remove !== undefined) {
            animate_out(this.playing_piece_to_remove);
            this.playing_piece_to_remove = undefined;
        }
        for (let action of this.actions[this.current_index]) {
            let name = ActionType[action.type].toLowerCase();
            if (!new Set(["move", "add", "remove"]).has(name)) {
                name = "tactic";
            }
            if (name === "remove") {
                this.playing_piece_to_remove = action.source;
            }
            update_info();
            this.dispatchEvent(new CustomEvent(name, {detail:
                    {action: action, piece_id: action.source, piece: this.current.pieces.get(action.source)}}));
        }
    }

    /*
    If the user went to a previous state and made a new change, delete all future board prior to that change
     */
    clear_future() {
        if (this.went_back) {
            this.states.length = this.current_index + 1;
            this.actions.length = this.current_index + 1;
        }
        this.went_back = false;
    }

    /*
    Advance the brief in 1 second intervals
     */
    play_from_current() {
        let i = 1;
        let that = this;
        // this.dispatchEvent(new CustomEvent("view_change", {detail: {current_index: this.current_index}}));
        while (this.current_index + i < this.states.length) {
            setTimeout(function() {
                that.go_forwards();
            }, i * 1000);
            i += 1;
        }
    };
}