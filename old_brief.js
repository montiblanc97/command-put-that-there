var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/*
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
var OldBrief = /** @class */ (function (_super) {
    __extends(OldBrief, _super);
    function OldBrief() {
        var _this = _super.call(this) || this;
        _this.unique_id = 0;
        _this.states = [];
        _this.actions = [[]];
        _this.name_to_id = new Map();
        _this.setup = false;
        _this.current = new Board();
        _this.states.push(_this.current);
        _this.current_index = 0;
        return _this;
    }
    OldBrief.prototype.set_setup = function (on) {
        this.setup = on;
    };
    OldBrief.prototype.update_all = function (piece_id, key, value) {
        for (var _i = 0, _a = this.states; _i < _a.length; _i++) {
            var board = _a[_i];
            board.update(piece_id, key, value);
        }
    };
    /*
    Wipes the Action history of the current Board for all actions with the same values as the parameters
    Undefined parameters means that property is ignored
     */
    OldBrief.prototype.clear_action = function (type, source, target) {
        var current_actions = this.actions[this.current_index];
        for (var i = 0; i < current_actions.length; i++) {
            var action = current_actions[i];
            if ((type === undefined || action.type === type) &&
                (source === undefined || action.source === source) &&
                (target === undefined || action.target === target)) {
                this.actions[this.current_index].splice(i, 1);
                i--;
            }
        }
    };
    OldBrief.prototype.change_current_state = function (index) {
        if (index < 0 || index > this.states.length) {
            throw "Given index " + index + "not valid index of states";
        }
        this.current = this.states[index];
        this.current_index = index;
    };
    OldBrief.prototype.change_to_last_state = function () {
        this.change_current_state(this.states.length - 1);
    };
    // don't worry about properties, just add_piece blank piece to board, as long as ID is correct
    OldBrief.prototype.add = function (piece) {
        piece.id = this.unique_id;
        this.unique_id++; // increment to keep unique
        var next_state = this.current.add(piece);
        if (this.setup) {
            this.current = next_state;
            this.clear_action(ActionType.Remove, piece.id, undefined);
            if (this.actions.length === 0) {
                this.actions.push([new Action(ActionType.Add, piece.id, undefined)]);
            }
            else {
                this.actions[this.actions.length - 1].push(new Action(ActionType.Add, piece.id, undefined));
            }
        }
        else {
            console.log("hit");
            this.states.push(next_state);
            this.actions.push([new Action(ActionType.Add, piece.id, undefined)]);
            this.change_to_last_state();
        }
        this.dispatchEvent(new CustomEvent("add", { detail: { piece: piece } }));
    };
    OldBrief.prototype.remove = function (piece_id) {
        var next_state = this.current.remove(piece_id);
        if (next_state === undefined) {
            return;
        }
        if (this.setup) {
            this.current = next_state;
            this.clear_action(ActionType.Add, piece_id, undefined);
        }
        else {
            console.log("hit");
            this.states.push(next_state);
            this.actions.push([new Action(ActionType.Remove, piece_id, undefined)]);
            this.change_to_last_state();
        }
    };
    OldBrief.prototype.move = function (piece_id, location_id) {
        var next_state = this.current.move(piece_id, location_id);
        if (next_state === undefined) {
            return;
        }
        if (this.setup) {
            this.current = next_state; // don't need to add_piece action since Actions don't track coordinates
        }
        else {
            console.log("hit");
            this.states.push(next_state);
            this.actions.push([new Action(ActionType.Move, piece_id, location_id)]);
            this.change_to_last_state();
        }
    };
    OldBrief.prototype.tactic = function (type, piece_id, location_id) {
        if (this.setup) {
            return;
        }
        console.log("hit");
        this.states.push(this.current.copy());
        this.actions.push([new Action(type, piece_id, location_id)]);
        this.change_to_last_state();
    };
    return OldBrief;
}(EventTarget));
//# sourceMappingURL=old_brief.js.map