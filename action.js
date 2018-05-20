/*
An action between a Unit and another Unit, or a Unit and a Point.

type: of action, see ActionType
source: Piece ID of piece conducting the action
target: Piece ID of piece affected by the action
 */
var Action = /** @class */ (function () {
    function Action(type, source, target) {
        this.type = type;
        this.source = source;
        this.target = target;
    }
    return Action;
}());
var ActionType;
(function (ActionType) {
    ActionType[ActionType["Add"] = 0] = "Add";
    ActionType[ActionType["Remove"] = 1] = "Remove";
    ActionType[ActionType["Move"] = 2] = "Move";
    ActionType[ActionType["Attack"] = 3] = "Attack";
    ActionType[ActionType["Support"] = 4] = "Support";
    ActionType[ActionType["Clear"] = 5] = "Clear";
    ActionType[ActionType["Retain"] = 6] = "Retain";
    ActionType[ActionType["Secure"] = 7] = "Secure"; // source: Piece ID of securing element | target: Piece ID of place being secured
})(ActionType || (ActionType = {}));
var tactics = new Set([ActionType.Attack,
    ActionType.Support,
    ActionType.Clear,
    ActionType.Retain,
    ActionType.Secure]);
//# sourceMappingURL=action.js.map