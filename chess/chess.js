const basicBoard = [
    [{type: 'rook', color: 'black'}, {type: 'knight', color: 'black'}, {type: 'bishop', color: 'black'}, {type: 'queen', color: 'black'}, {type: 'king', color: 'black'}, {type: 'bishop', color: 'black'}, {type: 'knight', color: 'black'}, {type: 'rook', color: 'black'}],
    [{type: 'pawn', color: 'black'}, {type: 'pawn', color: 'black'}, {type: 'pawn', color: 'black'}, {type: 'pawn', color: 'black'}, {type: 'pawn', color: 'black'}, {type: 'pawn', color: 'black'}, {type: 'pawn', color: 'black'}, {type: 'pawn', color: 'black'}],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [{type: 'pawn', color: 'white'}, {type: 'pawn', color: 'white'}, {type: 'pawn', color: 'white'}, {type: 'pawn', color: 'white'}, {type: 'pawn', color: 'white'}, {type: 'pawn', color: 'white'}, {type: 'pawn', color: 'white'}, {type: 'pawn', color: 'white'}],
    [{type: 'rook', color: 'white'}, {type: 'knight', color: 'white'}, {type: 'bishop', color: 'white'}, {type: 'queen', color: 'white'}, {type: 'king', color: 'white'}, {type: 'bishop', color: 'white'}, {type: 'knight', color: 'white'}, {type: 'rook', color: 'white'}],
];

generateBoard(8, 8);

function generateBoard(x, y) {
    let chessBoard = document.getElementById("board_body");

    for (let i = 0; i < 8; i++) {
        let row = chessBoard.insertRow(-1);

        for (let j = 0; j < 8; j++) {
            let cell = row.insertCell(-1);
            cell.id = j + "-" + i
            addPiece(cell, basicBoard[i][j]);
        }
    } 
}

function addPiece(cell, piece) {
    if (piece !== null) {
        let imgPiece = document.createElement("img");   
        imgPiece.src = `/img/chess/${piece.color}_${piece.type}.svg`
        imgPiece.addEventListener("click", cellPos);
        cell.appendChild(imgPiece);
    } else {
        cell.classList.add("empty_cell");
    }
}

function cellPos(e) {
    let cell = e.currentTarget.parentNode;
    console.log(`X: ${cell.cellIndex} Y: ${cell.parentNode.rowIndex}`);
}

class Board {
    width;
    height;
    boardArray;

    constructor(width, height) {
        this.width = w;
        this.height = h;
        this.boardArray = basicBoard;
    }

    getPiece(x, y) {
        return this.boardArray[y][x];
    }
}

class Piece {
    type;
    color;

    hasMoved = false;

    constructor(type, color) {
        this.type = type;
        this.color = color;
    }

}