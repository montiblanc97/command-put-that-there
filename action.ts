/*
An action between a Unit and another Unit, or a Unit and a Point.

type: of action, see ActionType
source: Piece ID of piece conducting the action
target: Piece ID of piece affected by the action
 */
class Action {
    type: ActionType;
    source: Number;
    target: Number | Number[];

    constructor(type, source, target) {
        this.type = type;
        this.source = source;
        this.target = target;
    }
}

enum ActionType {
    Add,  // source: Piece ID that was added | target: undefined
    Remove,  // source: Piece ID that was removed | target: undefined
    Move,  // source: Piece ID that was moved | target: Piece ID or coordinates moved to

    Attack,  // source: Piece ID of attacking element | target: Piece ID of unit/place being attacked
    Support,  // source: Piece ID of support-by-fire element | target: Piece ID of unit/place being attacked
    Clear,  // source: Piece ID of clearing element | target: Piece ID of place being cleared
    Retain,  // source: Piece ID of retaining element | target: Piece ID of place being retained
    Secure  // source: Piece ID of securing element | target: Piece ID of place being secured
}

var tactics = new Set(
    [ActionType.Attack,
        ActionType.Support,
        ActionType.Clear,
        ActionType.Retain,
        ActionType.Secure]);