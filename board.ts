/*
 * Represents a board with pieces on it. Can also generate new Boards after an effect (add, remove, move pieces)
 * Note it doesn't know anything about actions.
 */
class Board {
    pieces: Map<Number, Piece>;
    time: Date;
    phase: string;

    constructor() {
        this.pieces = new Map<Number, Piece>();
    }

    /*
    Returns a deep copy of the board
     */
    copy(): Board {
        let copied = new Board();

        copied.pieces = new Map<Number, Piece>();
        this.pieces.forEach(function(value, key, map) {
            copied.pieces.set(key, value.copy());
        });
        copied.time = this.time;
        copied.phase = this.phase;
        return copied;
    }

    /*
    Updates a piece's attribute
     */
    update(piece_id: number, key: string, value) {
        let piece = this.pieces.get(piece_id);
        if (piece === undefined) {  // not on Board
            return;
        }

        let current_value = piece[key];
        if (current_value !== undefined && typeof(current_value) !== typeof(value)) {
            throw "New, updated value is not the same type as the old value"
        }

        piece[key] = value;
    }

    /*
    Adds a Piece to the board. If a Piece with the same ID already exists, the existing Piece will be overwritten
    Returns new Board with the new Piece
     */
    add(piece: Piece): Board {
        let out = this.copy();

        out.pieces.set(piece.id, piece);

        return out;
    }

    /*
    Remove an existing Piece on the board
    Returns new Board with the Piece removed
    Returns undefined if piece doesn't exist
     */
    remove(piece_id: number): Board {
        let out = this.copy();

        let moving_piece = out.pieces.get(piece_id);
        if (moving_piece === undefined) {
            return undefined;
        }
        out.pieces.delete(piece_id);

        return out;
    }

    /*
    Move an existing Piece on the board to a new location (represented by another Piece)
    Returns new Board with the Piece moved
    Returns undefined if piece doesn't exist
     */
    move(piece_id: number, location_id: number): Board {
        let out = this.copy();

        let moving_piece = out.pieces.get(piece_id);
        if (moving_piece === undefined) {
            console.log('bad2');
            return undefined;
        }
        let location_piece = out.pieces.get(location_id);
        if (location_piece === undefined) {
            console.log('bad2');
            return undefined;
        }

        moving_piece.coordinates = location_piece.coordinates;

        return out;
    }
}

/*
Checks if given location is valid i.e. that it's length 2
 */
let location_check = function(location: number[]) {
    if (location.length !== 2) {
        throw "Invalid location, must be [x coordinate, y coordinate]"
    }
};