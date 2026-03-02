const Pieces = Object.freeze({
    EMPTY: Symbol("empty"),
    PAWN: Symbol("pawn"),
    ROOK: Symbol("rook"),
    KNIGHT: Symbol("knight"),
    BISHOP: Symbol("bishop"),
    QUEEN: Symbol("queen"),
    KING: Symbol("king"),
});

const basicBoard = [
    [Pieces.ROOK, Pieces.KNIGHT, Pieces.BISHOP, Pieces.QUEEN, Pieces.KING, Pieces.BISHOP, Pieces.KNIGHT, Pieces.ROOK],
    [Pieces.PAWN, Pieces.PAWN, Pieces.PAWN, Pieces.PAWN, Pieces.PAWN, Pieces.PAWN, Pieces.PAWN, Pieces.PAWN],
    [Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY],
    [Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY],
    [Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY],
    [Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY, Pieces.EMPTY],
    [Pieces.PAWN, Pieces.PAWN, Pieces.PAWN, Pieces.PAWN, Pieces.PAWN, Pieces.PAWN, Pieces.PAWN, Pieces.PAWN],
    [Pieces.ROOK, Pieces.KNIGHT, Pieces.BISHOP, Pieces.QUEEN, Pieces.KING, Pieces.BISHOP, Pieces.KNIGHT, Pieces.ROOK],
];

generateBoard(8, 8);

function generateBoard(x, y) {
    let chessBoard = document.getElementById("board_body");

    for (let i = 0; i < 8; i++) {
        let row = chessBoard.insertRow(-1);

        for (let j = 0; j < 8; j++) {
            let cell = row.insertCell(-1);
            addPiece(cell, basicBoard[i][j]);
        }
    } 
}

function addPiece(cell, piece) {
    if (piece !== Pieces.EMPTY) {
        let imgPiece = document.createElement("img");   
        imgPiece.src = "/img/chess/" + piece.description + ".svg";
        cell.appendChild(imgPiece);
    } else {
        cell.classList.add("empty_cell");
    }
}



class Board {
    width;
    height;
    boardArray;


    constructor() {
        this.width = w;
        this.height = h;
        this.boardArray = basicBoard;
    }
}

class Piece {
    type;
    construct;
}