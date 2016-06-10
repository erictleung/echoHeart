// To Do:
// - Error checking
// - Implement risk score calculator
// https://www.framinghamheartstudy.org/risk-functions/coronary-heart-disease/hard-10-year-risk.php

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
             context.fail("Invalid Application ID");
        }
        */

        //if (event.session.new) {
        //    onSessionStarted({requestId: event.request.requestId}, event.session);
        //}

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getInitialResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("GetNumber" === intentName) {
        setAnswer(intent, session, callback);
    } else if ("GetGender" === intentName) {
        setAnswer(intent, session, callback);
    } else if ("GetYesNo" === intentName) {
        setAnswer(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getInitialResponse(callback);
    } else if ("AMAZON.StopIntent" === intentName || "AMAZON.CancelIntent" === intentName) {
        handleSessionEndRequest(callback);
    }
    else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getInitialResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {
        totalQs : 0,
        age : {
            value : "",
            asked : 0,
            question: " How old are you?",
            nextQ : "gender",
            reprompt : " Can you tell me how old you are?",
            intentType: "GetNumber",
            slotType : "Number",
            min : 20,
            max : 79
        },
        gender : {
            value : "",
            asked : 0,
            question : " What is your gender?",
            nextQ : "cholesterol",
            reprompt : " Are you male or female?",
            intentType: "GetGender",
            slotType : "Gender"
        },
        cholesterol : {
            value : "",
            asked : 0,
            question : " What is your total cholesterol?",
            nextQ : "hdl",
            reprompt : " Can you tell me your total cholesterol?",
            intentType: "GetNumber",
            slotType : "Number",
            min : 130,
            max : 320
        },
        hdl : {
            value : "",
            asked : 0,
            question : " What is your HDL cholesterol?",
            nextQ : "sbp",
            reprompt : " Can you tell me your HDL cholesterol?",
            intentType: "GetNumber",
            slotType : "Number",
            min : 20,
            max : 100
     },
        sbp : {
            value : "",
            asked : 0,
            question : " What is your systolic blood pressure?",
            nextQ : "smoking",
            reprompt : " Can you tell me your systolic blood pressure??",
            intentType: "GetNumber",
            slotType : "Number",
            min : 90,
            max : 200
        },
        smoking : {
            value : "",
            asked : 0,
            question : " Do you smoke, yes or no?",
            nextQ : "hbpmeds",
            reprompt: " Do you smoke, yes or no?",
            intentType: "GetYesNo",
            slotType : "YesNo"
        },
        hbpmeds : {
            value : "",
            asked : 0,
            question : " Are you currently on any medication to treat high blood pressure?",
            nextQ : null,
            reprompt : " Are you currently on any medication to treat high blood pressure?",
            intentType: "GetYesNo",
            slotType : "YesNo"
        },
        lastQuestion : ""
    };
    
    var cardTitle = "Cardiovascular Risk Score";
    var speechOutput = "To calculate your Cardiovascular Risk Score, " 
            + "I will need to ask you a series of seven questions. ";

    // Ask the Question and update the session attributes
    speechOutput += sessionAttributes.age.question;
    sessionAttributes.totalQs++;
    sessionAttributes.lastQuestion = "age";
    sessionAttributes.age.asked = 1;
    repromptText = sessionAttributes.age.reprompt;
	
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    var cardTitle = "Session Ended";
    var speechOutput = "Thank you for trying the Cardiovascular Risk Calculator!";
    // Setting this to true ends the session and exits the skill.
    var shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

/**
 * Sets the answer in the session and prepares the speech to reply to the user.
 */
function setAnswer(intent, session, callback) {
    var cardTitle = intent.name;
    //var number = intent.slots.Number;
    var repromptText = "";
    var shouldEndSession = false;
    var speechOutput = "";
    
    // Make new object of session attributes if it doesn't exist
    if(session.attributes) {
        sessionAttributes = session.attributes;
    } else {
        sessionAttributes = {};
    }

    // Need error checking here
    if (session.attributes[session.attributes.lastQuestion].intentType === intent.name) {
    	var answer = intent.slots[session.attributes[session.attributes.lastQuestion].slotType];
  
      if (session.attributes.totalQs === 0) {
        speechOutput = "I haven't asked a question.";
      } else if (session.attributes.totalQs > 0 && session.attributes.totalQs < 7) {
        session.attributes[session.attributes.lastQuestion].value = answer.value;
        //speechOutput = "I have asked: " + session.attributes.lastQuestion
        //   + ". which now has a value of " + answer.value + ". "
        //   + "The next question should be about "
        //   + session.attributes[session.attributes.lastQuestion].nextQ + " ";

        var nextQVal = session.attributes[session.attributes.lastQuestion].nextQ
        speechOutput += session.attributes[nextQVal].question;

        sessionAttributes.totalQs++;
        sessionAttributes.lastQuestion = session.attributes[session.attributes.lastQuestion].nextQ;
        sessionAttributes[session.attributes.lastQuestion].asked = 1;
        repromptText = sessionAttributes[session.attributes.lastQuestion].reprompt;
      } else if (session.attributes.totalQs === 7) {
        speechOutput = "OK, Thank you. "
            + "Here is the information that I have gathered: "
            + "You are a " + session.attributes.age.value + " year old " 
            + session.attributes.gender.value
            + " with a total cholesterol of " + session.attributes.cholesterol.value
            + " and HDL of " + session.attributes.hdl.value
            + " and a systolic blood pressure of " + session.attributes.sbp.value;
        if (session.attributes.smoking.value == 'Yes') {
            speechOutput += ". You smoke or have smoked in the past and ";
        } else {
            speechOutput += ". You have never smoked and ";
        }
        if (session.attributes.hbpmeds.value == 'Yes') {
            speechOutput += "you take high blood pressure medications.";
        } else {
            speechOutput += "you do not take any high blood pressure medications.";
        }
        speechOutput += " I will now calculate your 10-year and lifetime Cardiovascular Risk Score.";
        shouldEndSession = true;
      } else {
        speechOuptut = "Oops."
      }
    } else {
      // Try reprompt user if there isn't 
      speechOutput = "Sorry, that answer doesn't make sense. ";
      speechOutput += sessionAttributes[session.attributes.lastQuestion].reprompt;
    }
    
    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}