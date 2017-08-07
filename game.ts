interface GameInterface {
    numberOfPlayers: number;
}

enum Colour {Grey, Red, LightBlue, DarkBlue, Pink, Yellow};
let colours: string[] = [
    '#CCCCCC',
    '#FF0000',
    '#005CFF',
    '#00C3FF',
    '#FF00F8',
    '#FFBA00',
];

enum Letter {A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,BLANK};
let letterValues: number[] = [
    1,3,3,2,1,4,2,4,1,8,5,1,3,1,1,3,10,1,1,1,1,4,4,8,4,10,0
];
let letterCounts: number[] = [
    9,2,2,4,12,2,3,2,9,1,1,4,2,6,8,2,1,6,4,6,4,2,2,1,2,1,2
];
let letterText: string[] = [
    'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',''
];


class Game implements GameInterface {
    
    public numberOfPlayers: number = 2;
    
    private board: Board;
    private letterBag: LetterTile[];
    private playedLetters: LetterTile[];
    private players: Player[] = [];
    private playerTurn: number;
    private gameElementSelector: string;
    
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
        
        // this.numberOfPlayers = numberOfPlayers;
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
        
        content += this.board.html();
        
        content += '<p>Letters remaining: ' + this.letterBag.length + '</p>';
        
        content += '<p>Currently playing: Player ' + (this.playerTurn + 1) + '</p>';
        
        // for(; p<this.players.length; p++) {
        content += this.players[this.playerTurn].displayLetters();
        // }
        
        content += '<button onclick="window.scrabble.skipTurn()">Skip Turn</button>';
        content += '<button onclick="window.scrabble.submitWord()">Play Word</button>';
        
        document.querySelector(this.gameElementSelector).innerHTML = content;
    }
    
    /*
    public getLetterTileById(id: number) {
        
    }
    */
    
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
        
        let player: Player = this.getCurrentPlayer(); // current player
        
        // Get the word
        let word: Array<{ word: string, score: number }> = this.findPlayedWords();
        
        // console.log(word);
        
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
    
    public findPlayedWords(): Array<{ word: string, score: number }> {
        let player: Player = this.getCurrentPlayer(); // current player
        
        // create array of played letters in correct order
        let pl: number = 0;
        let tempLetter: LetterTile;
        let orderedLetters: Array<LetterTile> = [];
        
        for(;pl<player.letters.length;pl++) {
            tempLetter = player.letters[pl];
            
            if(tempLetter.status == 2) {
                // letter played
                if(orderedLetters.length == 0) {
                    orderedLetters.push(tempLetter);
                }
                else {
                    let ol: number = 0;
                    let tempLetter2: LetterTile;
                    let inserted: boolean = false;
                    for(;ol<orderedLetters.length; ol++) {
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
        }
        
        
        // now check for what word(s) it's attached to
        let ol: number = 0;
        let at: LetterTile;
        let dir: string = "";
        let score: number = 0;
        let skipEnd: boolean = false;
        
        let currentword: Array<LetterTile> = [];
        
        for(;ol<orderedLetters.length; ol++) {
            tempLetter = orderedLetters[ol];
            
            if(ol == 0) {
                if(orderedLetters.length == 1) {
                    // only one letter
                    // dir = "none";
                    
                    currentword = this.checkVerticalWord(tempLetter);
                    if(currentword.length > 1) {
                        score += this.getWordScore(currentword);
                    }
                    
                    currentword = this.checkHorizontalWord(tempLetter);
                    if(currentword.length > 1) {
                        score += this.getWordScore(currentword);
                    }                    
                }
                else {
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
                                console.log('getWordScore1');
                                score += this.getWordScore(currentword);
                            }
                        }
                        
                        currentword = this.checkVerticalWord(tempLetter);
                        if(currentword.length > 1) {
                            console.log('getWordScore2');
                            score += this.getWordScore(currentword);
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
                                
                                score += this.getWordScore(currentword);
                            }
                            
                            currentword = this.checkHorizontalWord(tempLetter);
                            if(currentword.length > 1) {
                                score += this.getWordScore(currentword);
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
                    currentword = this.checkVerticalWord(tempLetter);
                    if(currentword.length > 1) {
                        score += this.getWordScore(currentword);
                    }
                    
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
                        score += this.getWordScore(currentword);
                    }
                }
                if(dir == "down") {
                    currentword = this.checkHorizontalWord(tempLetter);
                    if(currentword.length > 1) {
                        score += this.getWordScore(currentword);
                    }
                    
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
                        score += this.getWordScore(currentword);
                    }
                }
            }
            else {
                // In the middle
                if(dir == "across") {
                    currentword = this.checkVerticalWord(tempLetter);
                    if(currentword.length > 1) {
                        score += this.getWordScore(currentword);
                    }
                }
                else if(dir == "down") {
                    currentword = this.checkHorizontalWord(tempLetter);
                    if(currentword.length > 1) {
                        score += this.getWordScore(currentword);
                    }                    
                }
            }
        }
        
        return null;
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
        if(diff == playerLetters.length) return playerLetters;
        
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
        
        for(;l<word.length;l++) {
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
        
        for(l = 0; l < letterCounts.length; l++) {
            for(c = 0; c < letterCounts[l]; c++) {
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