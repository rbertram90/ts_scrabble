/**
 * class Game
 * 
 * @param elementselector: DOM element query selector string
 * @description: Main game logic
 */

interface GameInterface {
    numberOfPlayers: number;
}

interface NumberMatrix {
    [index: number]: Array<number>;
}

enum Colour {Grey, Red, LightBlue, DarkBlue, Pink, Yellow};
enum Letter {A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,BLANK};

class Game implements GameInterface {

    public numberOfPlayers: number = 2;
    public skipValidation : boolean = false; // good for testing...

    private board         : Board;
    private letterBag     : LetterTile[];
    private playedLetters : LetterTile[];
    private players       : Player[] = [];
    private playerTurn    : number;
    private gameElementSelector: string;

    // Hex codes corressponding to the Colour enums
    public static colours: string[] = [
        '#CCCCCC', // Grey
        '#FF0000', // Red
        '#005CFF', // LightBlue
        '#00C3FF', // DarkBlue
        '#FF00F8', // Pink
        '#FFBA00', // Yellow
    ];
    
    // How many points each letter of the alphabet is worth (A-Z + blank)
    public static letterValues: number[] = [
        1,3,3,2,1,4,2,4,1,8,5,1,3,1,1,3,10,1,1,1,1,4,4,8,4,10,0
    ];
    // How many of each letter exists in the game (A-Z + blank)
    public static letterCounts: number[] = [
        9,2,2,4,12,2,3,2,9,1,1,4,2,6,8,2,1,6,4,6,4,2,2,1,2,1,2
    ];
    // Label for each letter (A-Z + blank)
    public static letterText: string[] = [
        'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',''
    ];

    public constructor(elementselector: string) {
        this.gameElementSelector = elementselector;
        (<any>window).scrabble = this;
    }
    
    public setup() {
        let output: string = '<h3>Game Setup</h3>';
        
        output += '<label for="numplayers">Number of Players</label>&nbsp;';
        output += '<select id="numplayers">';
        output += '<option value="1">1</option>';
        output += '<option value="2">2</option>';
        output += '<option value="3">3</option>';
        output += '<option value="4">4</option>';
        output += '</select>';
        
        output += '<button id="startgame" onclick="window.scrabble.start()">Start!</button>';
        
        document.querySelector(this.gameElementSelector).innerHTML = output;
    }
    
    /**
     * function start
     * Setup a new game
     */
    public start() {
        this.board = new Board();
        this.board.game = this;
        this.playerTurn = 0;
        
        this.populateBag();
        
        this.setupPlayers();
        
        this.draw();
    }
    
    /**
     * function draw
     * Outputs the game to the screen
     */
    public draw() {
        let content: string = "";
        let p: number = 0;
        
        content += this.displayGameStatus();
        content += this.board.html();
        content += this.players[this.playerTurn].displayLetters();
        content += '<button onclick="window.scrabble.skipTurn()">Skip Turn</button>';
        content += '<button onclick="window.scrabble.submitWord()">Play Word</button>';
        
        document.querySelector(this.gameElementSelector).innerHTML = content;
    }

    private displayGameStatus(): string {
        let content: string = "<div id='stats'>";

        content += '<p>Letters remaining: ' + this.letterBag.length + '</p>';

        for(let p: number = 0; p < this.players.length; p++) {
            content += '<p>Player ' + (p+1) + ' score: ' + this.players[p].score + '</p>';
        }

        content += '<p>Currently playing: Player ' + (this.playerTurn + 1) + '</p>';
        content += '<div id="messages"></div>';
        content += '</div>';
        return content;
    }
    
    public skipTurn() {
        
        // check that all tiles have been returned
        let t: number = 0;
        let tempLetter: LetterTile;
        for(; t<this.getCurrentPlayer().letters.length; t++) {
            tempLetter = this.getCurrentPlayer().letters[t];
            if(tempLetter.status == 2) {
                let elem: Element = tempLetter.getElement();
                let parent: Element = <Element> elem.parentNode;
                let squareID: Array<any> = parent.id.split("-");
                let square: Square = this.board.squares[squareID[1]][squareID[2]];
                square.tile = null;
                tempLetter.status = 1;
            }
        }
        
        this.nextPlayer();
    }
    
    public submitWord() {
        let player: Player = this.getCurrentPlayer();
        let words: Array<{ word: Array<LetterTile>, score: number }> = this.findPlayedWords();
        
        if(words == null) {
            // an invalid word played
            document.getElementById('messages').innerHTML = '<span class="error">Invalid Submission - Please correct and try again</span>';
            return false;
        }
        else {
            document.getElementById('messages').innerHTML = '';
        }

        for(let w: number = 0; w < words.length; w++) {
            player.score += words[w].score;
        }

        // loop variables
        let tempLetter: LetterTile;
        let t: number = player.letters.length-1;
        
        // Loop through each of the letters the player holds
        // if it's on the board then remove from players tiles and lock on board
        for(; t>=0; t--) {
            tempLetter = player.letters[t];
            
            if(tempLetter.status == 2) {
                player.removeLetterTile(t);
                tempLetter.status = 3;
                
                this.playedLetters.push(tempLetter);
                
                // Give another letter
                if(this.letterBag.length > 0) player.giveLetterTile(this.letterBag.shift());
            }
        }
        
        this.nextPlayer();
    }
    
    /**
     * function findPlayedWords
     * @return Array of words made with tiles played in last turn along with a score for each
     */
    public findPlayedWords(): Array<{ word: Array<LetterTile>, score: number }> {

        // Get all letters that the user has placed on the board this turn
        // in the correct order
        let orderedLetters: Array<LetterTile> = this.getOrderedPlayedLetters();
        
        // now check for what word(s) it's attached to
        let at: LetterTile;
        let dir: string = "";
        let score: number = 0;
        let skipEnd: boolean = false;
        let tempLetter: LetterTile;
        
        let currentword: Array<LetterTile> = [];
        let allwords: Array<{ word: Array<LetterTile>, score: number }> = [];
        
        for(let ol: number = 0; ol < orderedLetters.length; ol++) {
            tempLetter = orderedLetters[ol];
            
            score = -1;

            if(ol == 0) {
                // first letter
                if(orderedLetters.length == 1) {
                    dir = "both"
                }
                else {
                    // more than one letter placed
                    if(orderedLetters[ol+1].square.row == tempLetter.square.row) {
                        dir = "across"
                        
                        if(tempLetter.square.column > 0) {
                            // check left
                            at = this.findPlayedTile(tempLetter.square.row, tempLetter.square.column - 1);
                            if(at !== null) {
                                skipEnd = true;
                                
                                // connected!                                
                                while(at !== null) {
                                    currentword.unshift(at);
                                    at = this.findPlayedTile(at.square.row, at.square.column - 1);
                                }
                                currentword = currentword.concat(this.getAllLettersInWord(orderedLetters, dir));
                                
                                // check for letters after
                                at = this.findPlayedTile(tempLetter.square.row, orderedLetters[orderedLetters.length - 1].square.column + 1);
                                
                                if(at !== null) {
                                    while(at !== null) {
                                        currentword.push(at);
                                        at = this.findPlayedTile(at.square.row, at.square.column + 1);
                                    }
                                }
                                score = this.getWordScore(currentword);
                                allwords.push({word: currentword, score: score});
                            }
                        }
                    }
                    else if(orderedLetters[ol+1].square.column == tempLetter.square.column) {
                        dir = "down"
                        
                        if(tempLetter.square.row > 0) {
                            // check above
                            at = this.findPlayedTile(tempLetter.square.row - 1, tempLetter.square.column);
                            if(at !== null) {
                                skipEnd = true;
                                
                                // connected!
                                while(at !== null) {
                                    currentword.unshift(at);
                                    at = this.findPlayedTile(at.square.row - 1, at.square.column);
                                }
                                currentword = currentword.concat(this.getAllLettersInWord(orderedLetters, dir));
                                
                                // check for letters after
                                at = this.findPlayedTile(orderedLetters[orderedLetters.length - 1].square.row + 1, tempLetter.square.column);
                                
                                if(at !== null) {
                                    while(at !== null) {
                                        currentword.push(at);
                                        at = this.findPlayedTile(at.square.row + 1, at.square.column);
                                    }
                                }
                                
                                score = this.getWordScore(currentword);
                                allwords.push({word: currentword, score: score});
                            }
                        }
                    }
                    else {
                        // Illegal move?
                    }
                }
            }
            else if(ol === (orderedLetters.length-1)) {
                // Last letter
                if(dir == "across") {
                    if(!skipEnd) {
                        currentword = this.getAllLettersInWord(orderedLetters, dir);
                        // haven't already checked end
                        // check for letters after
                        at = this.findPlayedTile(tempLetter.square.row, tempLetter.square.column + 1);
                        if(at !== null) {
                            while(at !== null) {
                                currentword.push(at);
                                at = this.findPlayedTile(at.square.row, at.square.column + 1);
                            }
                        }
                        score = this.getWordScore(currentword);
                        allwords.push({word: currentword, score: score});
                    }
                }
                if(dir == "down") {
                    if(!skipEnd) {
                        currentword = this.getAllLettersInWord(orderedLetters, dir);
                        // haven't already checked end
                        // check for letters after
                        at = this.findPlayedTile(tempLetter.square.row + 1, tempLetter.square.column);
                        if(at !== null) {
                            while(at !== null) {
                                currentword.push(at);
                                at = this.findPlayedTile(at.square.row + 1, at.square.column);
                            }
                        }
                        score = this.getWordScore(currentword);
                        allwords.push({word: currentword, score: score});
                    }
                }
            }

            if(dir == "across" || dir == "both") {
                currentword = this.checkVerticalWord(tempLetter);
                if(currentword.length > 1) {
                    score = this.getWordScore(currentword);
                    allwords.push({word: currentword, score: score});
                }
            }
            else if(dir == "down" || dir == "both") {
                currentword = this.checkHorizontalWord(tempLetter);
                if(currentword.length > 1) {
                    score = this.getWordScore(currentword);
                    allwords.push({word: currentword, score: score});
                }                    
            }

            if(score == 0) {
                // invalid word
                return null;
            }
        }
        return allwords;
    }


    public getOrderedPlayedLetters(): Array<LetterTile> {
        let player: Player = this.getCurrentPlayer();
        
        // Create an array of played letters, in the order that they are placed on the board
        let tempLetter: LetterTile;
        let orderedLetters: Array<LetterTile> = [];
        
        for(let pl: number = 0; pl < player.letters.length; pl++) {
            // 'pl = playerletter'
            tempLetter = player.letters[pl];
            
            if(tempLetter.status == 2) {
                // letter played this turn
                if(orderedLetters.length == 0) {
                    orderedLetters.push(tempLetter);
                    continue;
                }
                
                let tempLetter2: LetterTile;
                let inserted: boolean = false;
                for(let ol: number = 0; ol < orderedLetters.length; ol++) {
                    tempLetter2 = orderedLetters[ol];
                    
                    if(tempLetter2.square.row == tempLetter.square.row) {
                        if(tempLetter.square.column < tempLetter2.square.column) {
                            // insert at this position
                            orderedLetters.splice(ol, 0, tempLetter);
                            inserted = true;
                            break;
                        }
                    }
                    else if(tempLetter2.square.column == tempLetter.square.column) {
                        if(tempLetter.square.row < tempLetter2.square.row) {
                            // insert at this position
                            orderedLetters.splice(ol, 0, tempLetter);
                            inserted = true;
                            break;
                        }
                    }
                    else {
                        // Illegal move?
                        console.log('huh?');
                    }
                }
                
                if(!inserted) {
                    orderedLetters.push(tempLetter);
                }
            }
        }

        return orderedLetters;
    }
    
    // todo: think of a better name
    // basically if the player has added letters either side of a previously
    // placed letter we need to get all letters inbetween - played previously or on that turn
    // e.g. caMel where 'M' was already on the board and c,a,e and l were added in current turn
    private getAllLettersInWord(playerLetters: Array<LetterTile>, direction: string): Array<LetterTile> {
        
        let word: Array<LetterTile> = [];
        let start: number = 0;
        let end: number = 0;
        let diff: number = 0;
        
        if(direction == 'across') {
            // use column number
            start = playerLetters[0].square.column;
            end = playerLetters[playerLetters.length - 1].square.column;
        }
        if(direction == 'down') {
            // use column number
            start = playerLetters[0].square.row;
            end = playerLetters[playerLetters.length - 1].square.row;
        }
        
        diff = end - start + 1;
        
        // All letters joined
        if(diff == playerLetters.length) return playerLetters.slice();
        
        let lt: LetterTile;
        let nt: LetterTile;
        let l: number = start;
        let i: number = 0;
        for(;l<=end; l++) {
            lt = playerLetters[i];
            if(direction == 'across') {
                if(lt.square.column !== l) {
                    nt = this.findPlayedTile(lt.square.row, l);
                    word.push(nt);
                }
                else {
                    i++;
                    word.push(lt);
                }
            }
            if(direction == 'down') {
                if(lt.square.row !== l) {
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
    }
    
    // Check for joins above and below a letter
    private checkVerticalWord(tempLetter) {
        
        // console.log('checking vertical word');
        
        let currentword: Array<LetterTile> = [tempLetter];
        let at: LetterTile;
        
        if(tempLetter.square.row > 0) {
            // check above
            at = this.findPlayedTile(tempLetter.square.row - 1, tempLetter.square.column);
            if(at !== null) {
                // console.log('found above');
                
                // connected!                                
                while(at !== null) {
                    currentword.unshift(at);
                    at = this.findPlayedTile(at.square.row - 1, at.square.column);
                }
            }
        }
        if(tempLetter.square.row < 15) {
            // check for letters below
            at = this.findPlayedTile(tempLetter.square.row + 1, tempLetter.square.column);
            if(at !== null) {
                // console.log('found below');
                
                while(at !== null) {
                    currentword.push(at);
                    at = this.findPlayedTile(at.square.row + 1, at.square.column);
                }
            }
        }
        return currentword;
    }
    
    // Check for joins left and right of a letter
    private checkHorizontalWord(tempLetter) {
        
        // console.log('checking vertical word');
        
        let currentword: Array<LetterTile> = [tempLetter];
        let at: LetterTile;
        
        if(tempLetter.square.column > 0) {
            // check left
            at = this.findPlayedTile(tempLetter.square.row, tempLetter.square.column - 1);
            if(at !== null) {
                // console.log('found above');
                
                // connected!                                
                while(at !== null) {
                    currentword.unshift(at);
                    at = this.findPlayedTile(at.square.row, at.square.column - 1);
                }
            }
        }
        if(tempLetter.square.column < 15) {
            // check right
            at = this.findPlayedTile(tempLetter.square.row, tempLetter.square.column + 1);
            if(at !== null) {
                // console.log('found below');
                
                while(at !== null) {
                    currentword.push(at);
                    at = this.findPlayedTile(at.square.row, at.square.column + 1);
                }
            }
        }
        return currentword;
    }
    
    private getWordScore(word: Array<LetterTile>): number {
        let l: number = 0; // letter index
        let letter: LetterTile; // letter index
        let s: number = 0; // score
        let ts: number = 0; // temp score
        let wmp: number = 1; // word multiplyer
        let log: string = "";
        let wordstring: string = "";
        let validword: boolean = false;

        // Conver the array of letters to a string
        for(;l<word.length;l++) {

            if(word[l].index == Letter.BLANK && word[l].letter == '') {
                let blankletter: string = '';
                let lettervalid: boolean = false;
                while(!lettervalid) {
                    blankletter = prompt('What letter should be assigned to blank tile?');
                    blankletter = blankletter.toUpperCase();
                    if(blankletter.length == 1 && Game.letterText.indexOf(blankletter) != -1) {
                        lettervalid = true;
                    }
                }
                word[l].letter = blankletter;
            }

            wordstring += word[l].letter.toLowerCase();
        }

        if(!this.skipValidation) { // testing

            // Check that it is valid
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
                // console.log(xhr.responseXML.documentElement.nodeName);
                var potentialmatches = JSON.parse(xhr.responseText);

                // console.log(potentialmatches);
                // console.log(potentialmatches.indexOf(wordstring));
                if(potentialmatches.indexOf(wordstring) > -1) {
                    console.log('Word found');
                    validword = true;
                }
                else {
                    console.log('Word not found - ' + wordstring);
                    
                }
                
            }
            xhr.onerror = function() {
                console.log("Error while getting JSON.");
            }
            xhr.open("GET", "/words/" + wordstring.substring(0, 1)  + ".json", false);
            // xhr.responseType = "document";
            xhr.send();
            
            if(!validword) {
                return 0;
            }
        }

        for(l=0;l<word.length;l++) {
            letter = word[l];
            
            ts = letter.value;
            
            if(letter.status == 2) {
                // check for bonuses
                switch(Board.bonuses[letter.square.row][letter.square.column]) {
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
    }
    
    private findPlayedTile(row: number, column: number) {
        
        let n: number = this.playedLetters.length;
        let l: number = 0;
        let tempLetter: LetterTile;
        
        for(;l<n;l++) {
            tempLetter = this.playedLetters[l];
            
            if(tempLetter.square.row == row && tempLetter.square.column == column) {
                return tempLetter;
            }
        }
        
        return null;
    }
    
    private nextPlayer() {
        if(this.playerTurn == (this.players.length - 1)) {
            this.playerTurn = 0;
        }
        else {
            this.playerTurn++;
        }
        this.draw();
    }
    
    public getCurrentPlayer(): Player {
        return this.players[this.playerTurn];
    }
    
    /**
     * function populateBag
     * Create all letters
     */
    private populateBag() {
        // Clear any current data
        this.letterBag = [];
        this.playedLetters = [];
        
        this.numberOfPlayers = parseInt((<HTMLInputElement>document.getElementById('numplayers')).value);
        
        // Populate the bag of letters
        // Add in the correct amount of each letter in order
        let avialableLetters: number[] = [];
        let l: number;
        let c: number;
        
        for(l = 0; l < Game.letterCounts.length; l++) {
            for(c = 0; c < Game.letterCounts[l]; c++) {
                avialableLetters.push(l);
            }
        }
        
        // Randomise and convert to letter objects
        let letterIndex: number;
        let newTile: LetterTile;
        let t: number;
        for(t = avialableLetters.length; t > 0; t--) {
            letterIndex = Math.floor(t * Math.random());
            newTile = new LetterTile(avialableLetters.splice(letterIndex, 1)[0]);
            newTile.id = t;
            this.letterBag.push(newTile);
        }
    }
    
    /**
     * function setupPlayers
     * Create players & assign starting letters
     */
    private setupPlayers() {
        let p: number;
        let tilecount: number;
        let player: Player;
        
        for(p=0; p<this.numberOfPlayers; p++) {
            player = new Player();
            
            for(tilecount=0; tilecount<7; tilecount++) {
                player.giveLetterTile(this.letterBag.shift());
            }
            
            this.players.push(player);
        }
    }
}