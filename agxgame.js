var io;
var gameSocket;


/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    // Host Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('hostCountdownFinished', hostStartGame);
    gameSocket.on('hostNextRound', hostNextRound);

    // Player Events
    gameSocket.on('playerJoinGame', playerJoinGame);
    gameSocket.on('playerAnswer', playerAnswer);
    gameSocket.on('playerRestart', playerRestart);
}

/* *******************************
   *                             *
   *       HOST FUNCTIONS        *
   *                             *
   ******************************* */

/**
 * The 'START' button was clicked and 'hostCreateNewGame' event occurred.
 */

var drz = ["Iceland","Portugal","Marocco","Spain","Tunisia","Algeria","Netherland","Belgium","Italy","Belarus","Poland","Greece", "Kazakhstan","Finland","Germany","Sweden","Norway","Moldavia","Ukraine","Syria","Israel","Palestine","Jordan","Saudi Arabia","Iraq","Azerbaijan","Iran","Georgia","Croatia","Turkey","Armenia","Ireland","Hungary","Latvia","Lithuania","Romania","Bulgaria","Estonia","Lebanon","France","Austria","Bosnia and Herzegovina","Switzerland","Czech Republic","Slovakia","Slovenia","FYR Macedonia","Albania","Montenegro","Malta","Russia","Great Britain","Northern Ireland","Serbia","Cyprus"];
var currentCorrectAnswer;
var currentRound;
var hostSocketId;
var playerSocketId;
var hostName;
var playerName;
var round;
var hostScore;
var playerScore0;
var gameId;
var corect;
var playlist = [];
playlist = drz.slice();
var sample = [];
var gam = "gameId";

function Game(currentCorrectAnswer,currentRound,round,hostSocketId,playerSocketId,hostName,playerName,hostScore,
              playerScore,gameId,playlist) {
    this.currentCorrectAnswer = currentCorrectAnswer;
    this.currentRound = currentRound;
    this.round = round;
    this.hostSocketId = hostSocketId ;
    this.playerSocketId = playerSocketId;
    this.hostName = hostName;
    this.playerName = playerName;
    this.hostScore = hostScore;
    this.playerScore = playerScore;
    this.gameId = gameId;
    this.playlist = playlist;

}

function findIndexInData(data, property, value) {
    var result = -1;
    data.some(function (item, i) {
        if (item[property] === value) {
            result = i;
            return true;
        }
    });
    return result;
}

function hostCreateNewGame(){


    // Create a unique Socket.IO Room
    var thisGameId = ( Math.random() * 100 ) | 0;
var x = this.id;

    var obj = {currentCorrectAnswer:"",currentRound:1,round:1,hostSocketId:x,playerSocketId:" ",
        hostName:"",playerName:"",hostScore:0,playerScore:0,gameId: thisGameId,playlist: playlist};

//create new instance of game with starting variables
    //var game = new Game('',1,1,x,'','','',0,0,thisGameId,playlist);

    //place game instance in array
    sample.push(obj);

    //alert(findIndexInData(sample, gameId, thisGameId));
    // var game = new Game('',1,1,this.id,'','','',0,0,thisGameId,playlist);

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});

    //Host join the Room and wait for the player (oponnent)
    this.join(thisGameId.toString());


};

/*
 * Two players have joined. Alert the host!
 * @param gameId The game ID / room ID
 */

function hostPrepareGame(data) {
    var b = findIndexInData(sample, gam, data.gameId);

    sample[b].hostName = data.hostName;

    sample[b].currentRound = 1;
    sample[b].playlist = drz.slice();
    sample[b].hostScore = 0;
    sample[b].playerScore = 0;
   // sample[b].playerSocketId = this.id;



    var c = sample[b].playerName;

    var datas = {
        hostName: sample[b].hostName,
        playerName: sample[b].playerName,
        gameId : data.gameId
    };
    //console.log("All Players Present. Preparing game...");
    io.sockets.in(datas.gameId).emit('beginNewGame', datas);
};

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */

function hostStartGame(gameId) {
    console.log('Game Started.');
    sendWord(1,gameId);
};

/**
 * A player answered correctly. Time for the next word.
 * @param data Sent from the client. Contains the current round and gameId (room)
 */
function hostNextRound(data) {
    if(data.round < drz.length){
        // Send a new set of words back to the host and players.
        sendWord(data.round, data.gameId);
    } else {

        var winner = (hostScore < playerScore) ? hostName : playerName;
        var tie = (hostScore === playerScore);
        var no = 'nobody, its a tie';

        var data = {
            winner: winner,
            tie: no
        };



            io.sockets.in(data.gameId).emit('gameOver',data);
        }

}

//App.Host.numPlayersInRoom = 0;
// App.Host.isNewGame = true

/* *****************************
   *                           *
   *     PLAYER FUNCTIONS      *
   *                           *
   ***************************** */

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */

function playerJoinGame(data) {
    //console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );



    //get instance of game index


    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = gameSocket.manager.rooms["/" + data.gameId];

    var a = findIndexInData(sample, gam, data.gameId);

    sample[a].playerName = data.playerName;

    sample[a].playerSocketId = sock.id;





    // If the room exists...
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketId = sock.id;


        // Join the room
        sock.join(data.gameId);

        //console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
/*
        numPlayersInRoom += 1;
        if (numPlayersInRoom === 2) {*/
            // console.log('Room is full. Almost ready!');

            // Let the server know that two players are present.
            io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

        //    hostPrepareGame(data.gameId);



    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error',{message: "This room does not exist."} );
    }


}

/**
 * A player has tapped a word in the word list.
 * @param data gameId
 */
function playerAnswer(data) {
    // console.log('Player ID: ' + data.playerId + ' answered a question with: ' + data.answer);

    // The player's answer is attached to the data object.  \
    // Emit an event with the answer so it can be checked by the 'Host'
    var g = findIndexInData(sample, gam, data.gameId);



    if (sample[g].currentRound === data.round) {

        if (data.playerId == sample[g].hostSocketId) {
            if (sample[g].currentCorrectAnswer === data.answer) {

                sample[g].hostScore = sample[g].hostScore + 5;
                sample[g].currentRound += 1;
                sendWord(sample[g].currentRound, data.gameId);
                corect = 'tacno';

            }
            else {
                sample[g].hostScore = sample[g].hostScore - 3;
                corect = 'netacno';
            }

            var data = {
                gameId: data.gameId,
                round: sample[g].currentRound,
                hostScore: sample[g].hostScore,
                playerScore: sample[g].playerScore,
                answer: data.answer,
                ids: data.ids,
                role: 'Host',
               correct: corect

            }

            io.sockets.in(data.gameId).emit('updateResult', data);
            //console.log("Update result on the screen...");
        }
        if (data.playerId == sample[g].playerSocketId) {
            if (sample[g].currentCorrectAnswer === data.answer) {

                sample[g].playerScore = sample[g].playerScore + 5;

                sample[g].currentRound += 1;

                sendWord( sample[g].currentRound, data.gameId);
                corect = "tacno";;

            }
            else {
                sample[g].playerScore =  sample[g].playerScore - 3;
                corect = "netacno";

            }

            var data = {
                gameId: data.gameId,
                round: sample[g].currentRound,
                hostScore: sample[g].hostScore,
                playerScore: sample[g].playerScore,
                answer: data.answer,
                ids: data.ids,
                role: 'Player',
               correct: corect

            }

            io.sockets.in(data.gameId).emit('updateResult', data);
            //console.log("Update result on the screen...");
        }

    }
}

/**
 * The game is over, and a player has clicked a button to restart the game.
 * @param data
 */
function playerRestart(data) {
    // console.log('Player: ' + data.playerName + ' ready for new game.');

    // Emit the player's data back to the clients in the game room.

    data.playerId = this.id;
    io.sockets.in(data.gameId).emit('playerJoinedRoom',data);

}

/* *************************
   *                       *
   *      GAME LOGIC       *
   *                       *
   ************************* */

/**
 * Get a word for the host, and a list of words for the player.
 *
 * @param wordPoolIndex
 * @param gameId The room identifier
 */



function sendWord(wordPoolIndex,gameId) {


   /* if(wordPoolIndex==1){
        for(var i = 0; i < drz.length; i ++) {
            playlist.push(drz[i]);
        }
    }*/
    var p = findIndexInData(sample, gam, gameId);


    if(wordPoolIndex==5) {
        var winner = (sample[p].hostScore < sample[p].playerScore) ? sample[p].playerName : sample[p].hostName ;
        var tie = (sample[p].hostScore === sample[p].playerScore);
        var no = 'nobody, its a tie';

        var data = {
            winner: winner,
            tie: no
        };

        io.sockets.in(data.gameId).emit('gameOver',data);
    }


    var data = getX(wordPoolIndex,gameId);
    io.sockets.in(data.gameId).emit('newWordData', data);
}

/**
 * This function does all the work of getting a new words from the pile
 * and organizing the data to be sent back to the clients.
 *
 * @param i The index of the wordPool.
 * @returns {{round: *, word: *, answer: *, list: Array}}
 */



var states = ["ii","pt","ma","es","tn","al","ho","be","it","bl","po","gr","kz","fi","ne","sv","no","ml","uk","si","iz","pa","jo","sa","ir","az","in","gz","hr","tu","je","is","md","le","lt","ru","bu","et","lb","fr","au","bh","sc","ce","ss","sl","mk","ab","cg","mt","ra","vb","sz","rs","kn"];

var randomIndex;

function getX(runda,gameId){
    var o = findIndexInData(sample, gam, gameId);

    shuffle(sample[o].playlist);
    sample[o].currentCorrectAnswer = sample[o].playlist[0];
    var wordData = {
        round: runda,
        word : sample[o].playlist[0],   // answer id
        answer : sample[o].playlist[0], // Correct Answer
        list : sample[o].playlist,
        gameId: gameId
        // Remaining state in the list
    };

    sample[o].playlist.splice(0,1);

    return wordData;

}

function shuffle(array) {
    var currentIndex = array.length;
    var temporaryValue;


    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;

    }

    return array;
}



