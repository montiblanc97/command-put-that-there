/*
OLD CODE: UNUSED
See brief.js, TypeScript wouldn't cut it for this

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
class OldBrief extends EventTarget{
    unique_id = 0;

    briefer: Leader;
    mission_name: String;

    states: Board[] = [];
    actions: Action[][] = [[]];
    name_to_id = new Map<String, Number>();

    current: Board;
    current_index: number;
    last_piece: Piece;

    setup: boolean;
    setup_states: Board[];

    constructor() {
        super();
        this.setup = false;
        this.current = new Board();
        this.states.push(this.current);
        this.current_index = 0;
    }

    set_setup(on: boolean) {
        this.setup = on;
    }

    update_all(piece_id: number, key: string, value) {
        for (let board of this.states) {
            board.update(piece_id, key, value)
        }
    }

    /*
    Wipes the Action history of the current Board for all actions with the same values as the parameters
    Undefined parameters means that property is ignored
     */
    clear_action(type: ActionType, source: number, target: number) {
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

    change_current_state(index: number) {
        if (index < 0 || index > this.states.length) {
            throw "Given index " + index + "not valid index of states"
        }
        this.current = this.states[index];
        this.current_index = index;
    }

    change_to_last_state() {
        this.change_current_state(this.states.length - 1)
    }

    // don't worry about properties, just add_piece blank piece to board, as long as ID is correct
    add(piece: Piece) {
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
            console.log("hit");
            this.states.push(next_state);
            this.actions.push([new Action(ActionType.Add, piece.id, undefined)]);
            this.change_to_last_state();
        }

        this.dispatchEvent(new CustomEvent("add", {detail: {piece: piece}}))
    }

    remove(piece_id: number) {
        let next_state = this.current.remove(piece_id);

        if (next_state === undefined) {  // piece doesn't exist on current board
            return;
        }

        if (this.setup) {
            this.current = next_state;
            this.clear_action(ActionType.Add, piece_id, undefined);
        } else {
            console.log("hit");
            this.states.push(next_state);
            this.actions.push([new Action(ActionType.Remove, piece_id, undefined)]);
            this.change_to_last_state()
        }
    }

    move(piece_id: number, location_id: number) {
        let next_state = this.current.move(piece_id, location_id);

        if (next_state === undefined) {  // not found on Board
            return
        }

        if (this.setup) {
            this.current = next_state;  // don't need to add_piece action since Actions don't track coordinates
        } else {
            console.log("hit");
            this.states.push(next_state);
            this.actions.push([new Action(ActionType.Move, piece_id, location_id)]);
            this.change_to_last_state()
        }
    }

    tactic(type: ActionType, piece_id: number, location_id: number) {
        if (this.setup) {  // don't support during setup (may change later)
            return
        }
        console.log("hit");
        this.states.push(this.current.copy());
        this.actions.push([new Action(type, piece_id, location_id)]);
        this.change_to_last_state();
    }
}