/**
 * board.ts
 *
 * class Board
 * class Square
 */
var Board = (function () {
    function Board() {
        this.game = null;
        this.squares = [];
        this.createSquares();
    }
    Board.prototype.createSquares = function () {
        var row;
        var column;
        var rowData;
        var newSquare;
        for (row = 0; row < 15; row++) {
            rowData = [];
            for (column = 0; column < 15; column++) {
                newSquare = new Square(row, column);
                newSquare.board = this;
                rowData.push(newSquare);
            }
            this.squares.push(rowData);
        }
    };
    Board.prototype.html = function () {
        var boardView = "";
        var row;
        var column;
        var currentSquare;
        for (row = 0; row < 15; row++) {
            for (column = 0; column < 15; column++) {
                currentSquare = this.squares[row][column];
                boardView += currentSquare.html();
            }
        }
        return '<div class="board">' + boardView + '</div>';
    };
    /*
        squares
        0 = standard (no bonus)
        1 = double letter
        2 = triple letter
        3 = double word
        4 = triple word
    */
    Board.bonuses = [
        [4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 4],
        [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0],
        [0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0],
        [1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1],
        [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
        [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
        [4, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 4],
        [0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
        [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
        [1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1],
        [0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0],
        [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0],
        [4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 4]
    ];
    return Board;
}());
var Square = (function () {
    function Square(row, column) {
        this.board = null;
        this.tile = null;
        this.id = 'sq-' + row + '-' + column;
        this.row = row;
        this.column = column;
        this.bonus = Board.bonuses[row][column];
    }
    Square.allowDrop = function (ev) {
        if (ev.target.childNodes.length == 0) {
            ev.preventDefault();
        }
    };
    Square.drop = function (ev) {
        ev.preventDefault();
        var data = ev.dataTransfer.getData("text");
        ev.target.appendChild(document.getElementById(data));
        var squareIndex = ev.target.id.split("-");
        var targetSquare = window.scrabble.board.squares[squareIndex[1]][squareIndex[2]];
        var currentPlayer = window.scrabble.getCurrentPlayer();
        for (var tileIndex = 0; tileIndex < currentPlayer.letters.length; tileIndex++) {
            if (currentPlayer.letters[tileIndex].id == parseInt(data)) {
                var droppedTile = currentPlayer.letters[tileIndex];
                if (droppedTile.square != null) {
                    droppedTile.square.tile = null; // clear old square
                }
                targetSquare.tile = droppedTile;
                droppedTile.square = targetSquare;
                droppedTile.status = 2; // Mark as being played but not locked
                break;
            }
        }
    };
    Square.prototype.html = function () {
        var bgcolour;
        var output;
        switch (this.bonus) {
            case 0:
                bgcolour = Colour.Grey;
                break;
            case 1:
                bgcolour = Colour.LightBlue;
                break;
            case 2:
                bgcolour = Colour.DarkBlue;
                break;
            case 3:
                bgcolour = Colour.Pink;
                break;
            case 4:
                bgcolour = Colour.Red;
                break;
            case 5:
                bgcolour = Colour.Yellow;
                break;
        }
        output = '<div id="' + this.id + '" class="square" ondrop="Square.drop(event)" ondragover="Square.allowDrop(event)" style="background-color:' + Game.colours[bgcolour] + '">';
        if (this.tile != null)
            output += this.tile.html();
        output += '</div>';
        return output;
    };
    return Square;
}());
