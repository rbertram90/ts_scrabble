var Colour;
(function (Colour) {
    Colour[Colour["Grey"] = 0] = "Grey";
    Colour[Colour["Red"] = 1] = "Red";
    Colour[Colour["LightBlue"] = 2] = "LightBlue";
    Colour[Colour["DarkBlue"] = 3] = "DarkBlue";
    Colour[Colour["Pink"] = 4] = "Pink";
    Colour[Colour["Yellow"] = 5] = "Yellow";
})(Colour || (Colour = {}));
;
var colours = [
    '#CCCCCC',
    '#FF0000',
    '#005CFF',
    '#00C3FF',
    '#FF00F8',
    '#FFBA00',
];
var Letter;
(function (Letter) {
    Letter[Letter["A"] = 0] = "A";
    Letter[Letter["B"] = 1] = "B";
    Letter[Letter["C"] = 2] = "C";
    Letter[Letter["D"] = 3] = "D";
    Letter[Letter["E"] = 4] = "E";
    Letter[Letter["F"] = 5] = "F";
    Letter[Letter["G"] = 6] = "G";
    Letter[Letter["H"] = 7] = "H";
    Letter[Letter["I"] = 8] = "I";
    Letter[Letter["J"] = 9] = "J";
    Letter[Letter["K"] = 10] = "K";
    Letter[Letter["L"] = 11] = "L";
    Letter[Letter["M"] = 12] = "M";
    Letter[Letter["N"] = 13] = "N";
    Letter[Letter["O"] = 14] = "O";
    Letter[Letter["P"] = 15] = "P";
    Letter[Letter["Q"] = 16] = "Q";
    Letter[Letter["R"] = 17] = "R";
    Letter[Letter["S"] = 18] = "S";
    Letter[Letter["T"] = 19] = "T";
    Letter[Letter["U"] = 20] = "U";
    Letter[Letter["V"] = 21] = "V";
    Letter[Letter["W"] = 22] = "W";
    Letter[Letter["X"] = 23] = "X";
    Letter[Letter["Y"] = 24] = "Y";
    Letter[Letter["Z"] = 25] = "Z";
    Letter[Letter["BLANK"] = 26] = "BLANK";
})(Letter || (Letter = {}));
;
var letterValues = [
    1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10, 0
];
var letterCounts = [
    9, 2, 2, 4, 12, 2, 3, 2, 9, 1, 1, 4, 2, 6, 8, 2, 1, 6, 4, 6, 4, 2, 2, 1, 2, 1, 2
];
var letterText = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', ''
];
var Game = (function () {
    function Game(elementselector) {
        this.numberOfPlayers = 2;
        this.players = [];
        this.gameElementSelector = elementselector;
        window.scrabble = this;
    }
    Game.prototype.setup = function () {
        var output = '<h3>Game Setup</h3>';
        output += '<label for="numplayers">Number of Players</label>&nbsp;';
        output += '<select id="numplayers">';
        output += '<option value="1">1</option>';
        output += '<option value="2">2</option>';
        output += '<option value="3">3</option>';
        output += '<option value="4">4</option>';
        output += '</select>';
        output += '<button id="startgame" onclick="window.scrabble.start()">Start!</button>';
        document.querySelector(this.gameElementSelector).innerHTML = output;
        // this.numberOfPlayers = numberOfPlayers;
    };
    /**
     * function start
     * Setup a new game
     */
    Game.prototype.start = function () {
        this.board = new Board();
        this.board.game = this;
        this.playerTurn = 0;
        this.populateBag();
        this.setupPlayers();
        this.draw();
    };
    /**
     * function draw
     * Outputs the game to the screen
     */
    Game.prototype.draw = function () {
        var content = "";
        var p = 0;
        content += this.board.html();
        content += '<p>Letters remaining: ' + this.letterBag.length + '</p>';
        content += '<p>Currently playing: Player ' + (this.playerTurn + 1) + '</p>';
        // for(; p<this.players.length; p++) {
        content += this.players[this.playerTurn].displayLetters();
        // }
        content += '<button onclick="window.scrabble.skipTurn()">Skip Turn</button>';
        content += '<button onclick="window.scrabble.submitWord()">Play Word</button>';
        document.querySelector(this.gameElementSelector).innerHTML = content;
    };
    /*
    public getLetterTileById(id: number) {
        
    }
    */
    Game.prototype.skipTurn = function () {
        // check that all tiles have been returned
        var t = 0;
        var tempLetter;
        for (; t < this.getCurrentPlayer().letters.length; t++) {
            tempLetter = this.getCurrentPlayer().letters[t];
            if (tempLetter.status == 2) {
                var elem = tempLetter.getElement();
                var parent_1 = elem.parentNode;
                var squareID = parent_1.id.split("-");
                var square = this.board.squares[squareID[1]][squareID[2]];
                square.tile = null;
                tempLetter.status = 1;
            }
        }
        this.nextPlayer();
    };
    Game.prototype.submitWord = function () {
        var player = this.getCurrentPlayer(); // current player
        // Get the word
        var word = this.findPlayedWords();
        // console.log(word);
        // loop variables
        var tempLetter;
        var t = player.letters.length - 1;
        // Loop through each of the letters the player holds
        // if it's on the board then remove from players tiles and lock on board
        for (; t >= 0; t--) {
            tempLetter = player.letters[t];
            if (tempLetter.status == 2) {
                player.removeLetterTile(t);
                tempLetter.status = 3;
                this.playedLetters.push(tempLetter);
                // Give another letter
                if (this.letterBag.length > 0)
                    player.giveLetterTile(this.letterBag.shift());
            }
        }
        this.nextPlayer();
    };
    Game.prototype.findPlayedWords = function () {
        var player = this.getCurrentPlayer(); // current player
        // create array of played letters in correct order
        var pl = 0;
        var tempLetter;
        var orderedLetters = [];
        for (; pl < player.letters.length; pl++) {
            tempLetter = player.letters[pl];
            if (tempLetter.status == 2) {
                // letter played
                if (orderedLetters.length == 0) {
                    orderedLetters.push(tempLetter);
                }
                else {
                    var ol_1 = 0;
                    var tempLetter2 = void 0;
                    var inserted = false;
                    for (; ol_1 < orderedLetters.length; ol_1++) {
                        tempLetter2 = orderedLetters[ol_1];
                        if (tempLetter2.square.row == tempLetter.square.row) {
                            if (tempLetter.square.column < tempLetter2.square.column) {
                                // insert at this position
                                orderedLetters.splice(ol_1, 0, tempLetter);
                                inserted = true;
                                break;
                            }
                        }
                        else if (tempLetter2.square.column == tempLetter.square.column) {
                            if (tempLetter.square.row < tempLetter2.square.row) {
                                // insert at this position
                                orderedLetters.splice(ol_1, 0, tempLetter);
                                inserted = true;
                                break;
                            }
                        }
                        else {
                            // Illegal move?
                            console.log('huh?');
                        }
                    }
                    if (!inserted) {
                        orderedLetters.push(tempLetter);
                    }
                }
            }
        }
        // now check for what word(s) it's attached to
        var ol = 0;
        var at;
        var dir = "";
        var score = 0;
        var skipEnd = false;
        var currentword = [];
        for (; ol < orderedLetters.length; ol++) {
            tempLetter = orderedLetters[ol];
            if (ol == 0) {
                if (orderedLetters.length == 1) {
                    // only one letter
                    // dir = "none";
                    currentword = this.checkVerticalWord(tempLetter);
                    if (currentword.length > 1) {
                        score += this.getWordScore(currentword);
                    }
                    currentword = this.checkHorizontalWord(tempLetter);
                    if (currentword.length > 1) {
                        score += this.getWordScore(currentword);
                    }
                }
                else {
                    if (orderedLetters[ol + 1].square.row == tempLetter.square.row) {
                        dir = "across";
                        if (tempLetter.square.column > 0) {
                            // check left
                            at = this.findPlayedTile(tempLetter.square.row, tempLetter.square.column - 1);
                            if (at !== null) {
                                skipEnd = true;
                                // connected!                                
                                while (at !== null) {
                                    currentword.unshift(at);
                                    at = this.findPlayedTile(at.square.row, at.square.column - 1);
                                }
                                currentword = currentword.concat(this.getAllLettersInWord(orderedLetters, dir));
                                // check for letters after
                                at = this.findPlayedTile(tempLetter.square.row, orderedLetters[orderedLetters.length - 1].square.column + 1);
                                if (at !== null) {
                                    while (at !== null) {
                                        currentword.push(at);
                                        at = this.findPlayedTile(at.square.row, at.square.column + 1);
                                    }
                                }
                                console.log('getWordScore1');
                                score += this.getWordScore(currentword);
                            }
                        }
                        currentword = this.checkVerticalWord(tempLetter);
                        if (currentword.length > 1) {
                            console.log('getWordScore2');
                            score += this.getWordScore(currentword);
                        }
                    }
                    else if (orderedLetters[ol + 1].square.column == tempLetter.square.column) {
                        dir = "down";
                        if (tempLetter.square.row > 0) {
                            // check above
                            at = this.findPlayedTile(tempLetter.square.row - 1, tempLetter.square.column);
                            if (at !== null) {
                                skipEnd = true;
                                // connected!
                                while (at !== null) {
                                    currentword.unshift(at);
                                    at = this.findPlayedTile(at.square.row - 1, at.square.column);
                                }
                                currentword = currentword.concat(this.getAllLettersInWord(orderedLetters, dir));
                                // check for letters after
                                at = this.findPlayedTile(orderedLetters[orderedLetters.length - 1].square.row + 1, tempLetter.square.column);
                                if (at !== null) {
                                    while (at !== null) {
                                        currentword.push(at);
                                        at = this.findPlayedTile(at.square.row + 1, at.square.column);
                                    }
                                }
                                score += this.getWordScore(currentword);
                            }
                            currentword = this.checkHorizontalWord(tempLetter);
                            if (currentword.length > 1) {
                                score += this.getWordScore(currentword);
                            }
                        }
                    }
                    else {
                        // Illegal move?
                    }
                }
            }
            else if (ol === (orderedLetters.length - 1)) {
                // Last letter
                if (dir == "across") {
                    currentword = this.checkVerticalWord(tempLetter);
                    if (currentword.length > 1) {
                        score += this.getWordScore(currentword);
                    }
                    if (!skipEnd) {
                        currentword = this.getAllLettersInWord(orderedLetters, dir);
                        // haven't already checked end
                        // check for letters after
                        at = this.findPlayedTile(tempLetter.square.row, tempLetter.square.column + 1);
                        if (at !== null) {
                            while (at !== null) {
                                currentword.push(at);
                                at = this.findPlayedTile(at.square.row, at.square.column + 1);
                            }
                        }
                        score += this.getWordScore(currentword);
                    }
                }
                if (dir == "down") {
                    currentword = this.checkHorizontalWord(tempLetter);
                    if (currentword.length > 1) {
                        score += this.getWordScore(currentword);
                    }
                    if (!skipEnd) {
                        currentword = this.getAllLettersInWord(orderedLetters, dir);
                        // haven't already checked end
                        // check for letters after
                        at = this.findPlayedTile(tempLetter.square.row + 1, tempLetter.square.column);
                        if (at !== null) {
                            while (at !== null) {
                                currentword.push(at);
                                at = this.findPlayedTile(at.square.row + 1, at.square.column);
                            }
                        }
                        score += this.getWordScore(currentword);
                    }
                }
            }
            else {
                // In the middle
                if (dir == "across") {
                    currentword = this.checkVerticalWord(tempLetter);
                    if (currentword.length > 1) {
                        score += this.getWordScore(currentword);
                    }
                }
                else if (dir == "down") {
                    currentword = this.checkHorizontalWord(tempLetter);
                    if (currentword.length > 1) {
                        score += this.getWordScore(currentword);
                    }
                }
            }
        }
        return null;
    };
    // todo: think of a better name
    // basically if the player has added letters either side of a previously
    // placed letter we need to get all letters inbetween - played previously or on that turn
    // e.g. caMel where 'M' was already on the board and c,a,e and l were added in current turn
    Game.prototype.getAllLettersInWord = function (playerLetters, direction) {
        var word = [];
        var start = 0;
        var end = 0;
        var diff = 0;
        if (direction == 'across') {
            // use column number
            start = playerLetters[0].square.column;
            end = playerLetters[playerLetters.length - 1].square.column;
        }
        if (direction == 'down') {
            // use column number
            start = playerLetters[0].square.row;
            end = playerLetters[playerLetters.length - 1].square.row;
        }
        diff = end - start + 1;
        // All letters joined
        if (diff == playerLetters.length)
            return playerLetters;
        var lt;
        var nt;
        var l = start;
        var i = 0;
        for (; l <= end; l++) {
            lt = playerLetters[i];
            if (direction == 'across') {
                if (lt.square.column !== l) {
                    nt = this.findPlayedTile(lt.square.row, l);
                    word.push(nt);
                }
                else {
                    i++;
                    word.push(lt);
                }
            }
            if (direction == 'down') {
                if (lt.square.row !== l) {
                    nt = this.findPlayedTile(l, lt.square.column);
                    word.push(nt);
                }
                else {
                    i++;
                    word.push(lt);
                }
            }
        }
        return word;
    };
    // Check for joins above and below a letter
    Game.prototype.checkVerticalWord = function (tempLetter) {
        // console.log('checking vertical word');
        var currentword = [tempLetter];
        var at;
        if (tempLetter.square.row > 0) {
            // check above
            at = this.findPlayedTile(tempLetter.square.row - 1, tempLetter.square.column);
            if (at !== null) {
                // console.log('found above');
                // connected!                                
                while (at !== null) {
                    currentword.unshift(at);
                    at = this.findPlayedTile(at.square.row - 1, at.square.column);
                }
            }
        }
        if (tempLetter.square.row < 15) {
            // check for letters below
            at = this.findPlayedTile(tempLetter.square.row + 1, tempLetter.square.column);
            if (at !== null) {
                // console.log('found below');
                while (at !== null) {
                    currentword.push(at);
                    at = this.findPlayedTile(at.square.row + 1, at.square.column);
                }
            }
        }
        return currentword;
    };
    // Check for joins left and right of a letter
    Game.prototype.checkHorizontalWord = function (tempLetter) {
        // console.log('checking vertical word');
        var currentword = [tempLetter];
        var at;
        if (tempLetter.square.column > 0) {
            // check left
            at = this.findPlayedTile(tempLetter.square.row, tempLetter.square.column - 1);
            if (at !== null) {
                // console.log('found above');
                // connected!                                
                while (at !== null) {
                    currentword.unshift(at);
                    at = this.findPlayedTile(at.square.row, at.square.column - 1);
                }
            }
        }
        if (tempLetter.square.column < 15) {
            // check right
            at = this.findPlayedTile(tempLetter.square.row, tempLetter.square.column + 1);
            if (at !== null) {
                // console.log('found below');
                while (at !== null) {
                    currentword.push(at);
                    at = this.findPlayedTile(at.square.row, at.square.column + 1);
                }
            }
        }
        return currentword;
    };
    Game.prototype.getWordScore = function (word) {
        var l = 0; // letter index
        var letter; // letter index
        var s = 0; // score
        var ts = 0; // temp score
        var wmp = 1; // word multiplyer
        var log = "";
        for (; l < word.length; l++) {
            letter = word[l];
            ts = letter.value;
            if (letter.status == 2) {
                // check for bonuses
                switch (Board.bonuses[letter.square.row][letter.square.column]) {
                    case 0:
                        // no bonus
                        break;
                    case 1:
                        // double letter
                        ts *= 2;
                        break;
                    case 2:
                        // triple letter
                        ts *= 3;
                        break;
                    case 3:
                        // double word
                        wmp *= 2;
                        break;
                    case 4:
                        // triple word
                        wmp *= 3;
                        break;
                }
            }
            log += letter.letter + " -> " + ts;
            s += ts;
        }
        s *= wmp;
        log += "\n wmp = " + wmp;
        log += "\n score = " + s;
        console.log(log);
        return s;
    };
    Game.prototype.findPlayedTile = function (row, column) {
        var n = this.playedLetters.length;
        var l = 0;
        var tempLetter;
        for (; l < n; l++) {
            tempLetter = this.playedLetters[l];
            if (tempLetter.square.row == row && tempLetter.square.column == column) {
                return tempLetter;
            }
        }
        return null;
    };
    Game.prototype.nextPlayer = function () {
        if (this.playerTurn == (this.players.length - 1)) {
            this.playerTurn = 0;
        }
        else {
            this.playerTurn++;
        }
        this.draw();
    };
    Game.prototype.getCurrentPlayer = function () {
        return this.players[this.playerTurn];
    };
    /**
     * function populateBag
     * Create all letters
     */
    Game.prototype.populateBag = function () {
        // Clear any current data
        this.letterBag = [];
        this.playedLetters = [];
        this.numberOfPlayers = parseInt(document.getElementById('numplayers').value);
        // Populate the bag of letters
        // Add in the correct amount of each letter in order
        var avialableLetters = [];
        var l;
        var c;
        for (l = 0; l < letterCounts.length; l++) {
            for (c = 0; c < letterCounts[l]; c++) {
                avialableLetters.push(l);
            }
        }
        // Randomise and convert to letter objects
        var letterIndex;
        var newTile;
        var t;
        for (t = avialableLetters.length; t > 0; t--) {
            letterIndex = Math.floor(t * Math.random());
            newTile = new LetterTile(avialableLetters.splice(letterIndex, 1)[0]);
            newTile.id = t;
            this.letterBag.push(newTile);
        }
    };
    /**
     * function setupPlayers
     * Create players & assign starting letters
     */
    Game.prototype.setupPlayers = function () {
        var p;
        var tilecount;
        var player;
        for (p = 0; p < this.numberOfPlayers; p++) {
            player = new Player();
            for (tilecount = 0; tilecount < 7; tilecount++) {
                player.giveLetterTile(this.letterBag.shift());
            }
            this.players.push(player);
        }
    };
    return Game;
}());
