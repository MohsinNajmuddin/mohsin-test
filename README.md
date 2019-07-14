# Facebook Messanger Chatbot

## Deployment Server:

Used Heroku server for the deployment of Webhook created for Facebook Messenger.

Deployed Server Link: https://warm-tor-45494.herokuapp.com/

Heroku Installation on your machine:
1. brew tap heroku/brew && brew install heroku

Steps of Deployment

1. Goto the github branch of your working repository on your local machine.
2. login with your Heroku account by using the following command. (This command is for Mac Machine)
    $ heroku login 
3. Now deploy your changes to Heroku server by the following command
    $ git push heroku master
    
Note: Whenever you make any change on the local first commit and push it on your github branch, and then run the command mentioned on the step #3


## Dependencies:

1. Express.js
   npm install express body-parser --save
   
2. Installing GoodReads api node. (For accessing GoodReads api methods)
   npm install --save goodreads-api-node 
   
   You need to register your app to get a goodreads developer key With the developer key and secret you can now call goodreads().

## APIS:

1. https://graph.facebook.com/v3.3/me/messages

2. https://www.goodreads.com/book/show



## Screenshots:




