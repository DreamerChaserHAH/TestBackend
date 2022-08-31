//Author: Htet Aung Hlaing
//16th Aug, 2022

const { debug } = require("console");
var admin = require("firebase-admin"); //For retrieving the data from firebase
var http = require('http'); //For receiving connection from the users
var qs = require('querystring');
const Port = 4000;
var serviceAccount = require(__dirname+"/testservice.json");//#IMPORTANT: DO NOT SHARE THIS FILE WITH ANYONE NOR UPLOAD THIS ON A PUBLIC REPOSITORY

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const store = admin.firestore();

//Function to list down all root collections
async function GetClasses(Iteration, endLoop){
    store.listCollections().then(collections => {
        console.log("Root Collection");
        for (let collection of collections) {
            Iteration(collection.id)
        }
        endLoop();
    });
}
//remove the , in client app
function httpGetClasses(req, res){
    var DataToBeSent = "[";
    GetClasses((newData)=>{
        DataToBeSent += "{\"value\": \""+newData+"\"},";
    }, ()=>{
        console.log(DataToBeSent);
        res.end(DataToBeSent+"]");
    });
}

//Function to list down the chapters
function GetChapters(Iteration, endLoop, path){
store.collection(path).get().then(documents =>{
    documents.docs.map(function(doc){
        Iteration(doc.id);
    });
    endLoop();
});
}
function httpGetChapters(req,res,path){
    var DataToBeSent = "[";
    GetChapters((newData)=>{
        DataToBeSent += "{\"value\": \""+newData+"\"},";
    }, ()=>{
        console.log(DataToBeSent);
        res.end(DataToBeSent+"]");
    }, path);
}

//Function to list down the available type of data
function getTypeOfData(Iteration, EndLoop, path, path2){
    store.collection(path).doc(path2).listCollections().then(collections =>{
        for (let collection of collections) {
            Iteration(collection.id);
        }
        EndLoop();
    })
}
function httpGetTypeOfData(req,res,path1,path2){
    var DataToBeSent = "[";
    getTypeOfData((newData)=>{
        DataToBeSent += "{\"value\": \""+newData+"\"},";
    }, ()=>{
        console.log(DataToBeSent);
        res.end(DataToBeSent+"]");
    }, path1, path2);
}

function GetData(Iteration ,End, Class, Chapter, TypeOfContent){
    store.collection(Class).doc(Chapter).collection(TypeOfContent).get().then(documents =>{
        documents.docs.map(function(doc){
            //console.log(doc.data());
            Iteration(JSON.stringify(doc.data()));
        });
        End();
    });
}

function HttpGetData(req, res, Class, Chapter, TypeOfContent){
    var DataToBeSent = "[";
    var i = 0;
    GetData((result)=>{
        DataToBeSent += result+",";
        //console.log(i+":"+result.toString());
        i++
    },()=>{

        res.end(DataToBeSent+"]");
    }, Class, Chapter, TypeOfContent);
}

GetData((value)=>{
    console.log(value);
}, ()=>{
    
},"Class 9","Chapter 9 Forces and Laws of Motion", "Videos");

http.createServer(function (req, res) {

    if (req.method == 'POST') {
        var body = '';

        req.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6)
                req.connection.destroy();
        });

        req.on('end', function () {
            var post = qs.parse(body);
            if(post.type == 1){
                //Trying to get classes
                httpGetClasses(req,res);
            }else if(post.type == 2){
                console.log("getting Chapters");
                console.log(post.class);
                httpGetChapters(req,res,post.class);
            }else if(post.type == 3){
                console.log("getting available data");
                httpGetTypeOfData(req,res,post.class, post.chapter)
            }else if(post.type == 4){
                console.log("getting json data");
                HttpGetData(req,res, post.class, post.chapter, post.typeofdata);
            }
            // use post['blah'], etc.
        });
    }else{
        //invalid request
        res.end("hi");
    }

}).listen(Port);