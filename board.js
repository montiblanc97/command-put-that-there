var Board = /** @class */ (function () {
    function Board() {
        this.pieces = new Map();
    }
    Board.prototype.copy = function () {
        var copied = new Board();
        copied.pieces = new Map();
        this.pieces.forEach(function (value, key, map) {
            copied.pieces.set(key, value.copy());
        });
        copied.time = this.time;
        copied.phase = this.phase;
        return copied;
    };
    Board.prototype.update = function (piece_id, key, value) {
        var piece = this.pieces.get(piece_id);
        if (piece === undefined) {
            return;
        }
        var current_value = piece[key];
        if (current_value !== undefined && typeof (current_value) !== typeof (value)) {
            throw "New, updated value is not the same type as the old value";
        }
        piece[key] = value;
    };
    /*
    Adds a Piece to the board. If a Piece with the same ID already exists, the existing Piece will be overwritten
    Returns new Board with the new Piece
     */
    Board.prototype.add = function (piece) {
        var out = this.copy();
        out.pieces.set(piece.id, piece);
        return out;
    };
    /*
    Remove an existing Piece on the board
    Returns new Board with the Piece removed
    Returns undefined if piece doesn't exist
     */
    Board.prototype.remove = function (piece_id) {
        var out = this.copy();
        var moving_piece = out.pieces.get(piece_id);
        if (moving_piece === undefined) {
            return undefined;
        }
        out.pieces.delete(piece_id);
        return out;
    };
    /*
    Move an existing Piece on the board to a new location (represented by another Piece)
    Returns new Board with the Piece moved
    Returns undefined if piece doesn't exist
     */
    Board.prototype.move = function (piece_id, location_id) {
        var out = this.copy();
        var moving_piece = out.pieces.get(piece_id);
        if (moving_piece === undefined) {
            console.log('bad2');
            return undefined;
        }
        var location_piece = out.pieces.get(location_id);
        if (location_piece === undefined) {
            console.log('bad2');
            return undefined;
        }
        moving_piece.coordinates = location_piece.coordinates;
        return out;
    };
    return Board;
}());
var location_check = function (location) {
    if (location.length !== 2) {
        throw "Invalid location, must be [x coordinate, y coordinate]";
    }
};
//# sourceMappingURL=board.js.map