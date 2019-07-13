'use strict';

const request = require('request');

const PAGE_ACCESS_TOKEN = "EAAJ8YVVvr3YBAPeZCdLnrTZAkc3dROjlDDNXKUM1UaZBXRcFSFfiTBAfVruXWNYHv2EM0eJLZA92sZBcZBHNY2BPEB3Nvcu0E6EWTbnF0NUqtyvoH0O0VGsxP9dPVkMZA7ouRMgkYSZAY76kC8qnrslfS78wnxAZAA7Lp2QnRYjltT1jciIn9O9Ca";

const goodreads = require('goodreads-api-node');

const myCredentials = {
  key: 'gKOarUhI6MCtWEpCkcXHrg',
  secret: '5QkQUyqZP9qcbJvGyio4XT7VMmmGLEV485u9z1OoOU'
};

const gr = goodreads(myCredentials);

var selectedSearchOption = '';

// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));


// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      let sender_psid = webhook_event.sender.id;

      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "mindvalley";
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;
  // Check if the message contains text
  if (received_message.quick_reply) {
    if (received_message.quick_reply.payload === 'SEARCH_ID_PAYLOAD') {
      response = {
        'text': 'Please enter book ID'
      };
      selectedSearchOption = 'ID';
    } else if (received_message.quick_reply.payload === 'SEARCH_TITLE_PAYLOAD') {
      response = {
        'text': 'Please enter book title'
      };
      selectedSearchOption = 'TITLE';
    } else {
      console.log('BOOK_SEARCHED');
    }
    callSendAPI(sender_psid, response);
  } else if (received_message.text) {
    if (selectedSearchOption === 'TITLE') {
      selectedSearchOption = '';
      var searchObj = {
        q: received_message.text,
        page: 1,
        field: 'title'
      };
      gr.searchBooks(searchObj).then(function (response) {
        console.log('Book search by title');
        console.log(response);
        if (!!response.search.results.work) {
          var topFiveBooks = response.search.results.work.splice(0, 5).map(function (bookObj) {
            console.log(bookObj.best_book.id._);
            return { 'content_type': 'text', 'title': bookObj.best_book.title, 'payload': bookObj.best_book.id._};
          });
          console.log('topFiveBooks');
          console.log(topFiveBooks);
          response = {
            'text': 'Your searched results are listed below.\nClick on the book you would like to purchase, on the basis of its review we will help you in recommending whether to purchase it or not',
            'quick_replies': topFiveBooks
          };
          callSendAPI(sender_psid, response);
        } else {
          response = {
            'text': 'Sorry, could not find the book you searched. You may search for another book by using the following options.',
            'quick_replies':[
              {
                'content_type':'text', 'title':'Search by Id', 'payload':'SEARCH_ID_PAYLOAD'
              },{
                'content_type':'text', 'title':'Search by Title', 'payload':'SEARCH_TITLE_PAYLOAD'
              }
            ]
          };
        }
        callSendAPI(sender_psid, response);
      });
    } else if (selectedSearchOption === 'ID') {
      selectedSearchOption = '';
      gr.showBook(received_message.text).then(function (response) {
        console.log('Book search by id');
        console.log(response);
      });
    }
  }
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;
  // Get the payload for the postback
  let payloadtitle = received_postback.payload;

  // Set the response based on the postback payload
  if (payloadtitle === 'GET_STARTED_PAYLOAD') {
    response = {
      'text': 'Welcome to the readers club. Here you can search for books from our millions of records. Our collections contains books of different categories. To search for any book type its title or ID (Goodreads ID)',
      'quick_replies':[
        {
          'content_type':'text', 'title':'Search by Id', 'payload':'SEARCH_ID_PAYLOAD'
        },{
          'content_type':'text', 'title':'Search by Title', 'payload':'SEARCH_TITLE_PAYLOAD'
        }
       ]
     };
     setQuickReplies(sender_psid, response);
  } else {
     // Send the message to acknowledge the postback
     callSendAPI(sender_psid, response);
  }
}

function setQuickReplies(sender_psid, response) {
  let request_body = {
    "messaging_type": "RESPONSE",
    "recipient": {
      "id": sender_psid
    },
    "message": response,
  };
  console.log(request_body);

  request({
    "uri": "https://graph.facebook.com/v3.3/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {

  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  };

  console.log(request_body);

  request({
    "uri": "https://graph.facebook.com/v3.3/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
  
}