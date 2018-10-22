const functions = require('firebase-functions');
const path = require('path');
const os = require('os');
const cors = require('cors')({origin: true});
const Busboy = require('busboy');
const fs = require('fs');
const admin = require("firebase-admin");

admin.initializeApp(functions.config().firebase);
const destBucket = admin.storage().bucket();
//const gcs = admin.storage();

exports.uploadFile = functions.https.onRequest((req , res)=>{
	cors(req , res , ()=>{
      if (req.method !== 'POST') {
	    return res.status(500).json({
            message: 'not allowed'
          });
	  }
	  const busboy = new Busboy({headers: req.headers});
	  let uploadData = null;
	  busboy.on('file' , (fieldname , file , filename , encoding , mimetype)=>{
         const filePath = path.join(os.tmpdir() , filename);
         uploadData = {file: filePath , type: mimetype}
         file.pipe(fs.createWriteStream(filePath));
	  });
	  busboy.on('finish' , ()=>{
          destBucket.upload(uploadData.file , {
          uploadType: 'media',
          metadata: {
            metadata: {
              contentType: uploadData.type
            }
          }
    }).then(()=>{
            return res.status(200).json({
               message: 'it worked'
            });
     }).catch(err=>{
             res.status(500).json({
               error: err
            });
     });
	  });
    busboy.end(req.rawBody);
	}); 
});


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.onFileChange = functions.storage.object().onFinalize(event => {
	console.log(event);
  const contentType = event.contentType;
  const filePath = event.name;
  const os = require('os');
  const path = require('path');

  if (path.basename(filePath).startsWith('renamed-')) {
  	console.log('already rename');
  	return;
  }
  
  const tmpFilePath = path.join(os.tmpdir() , path.basename(filePath));
  const metaData = {contentType: contentType}
  return destBucket.file(filePath).download({
  	destination: tmpFilePath
  }).then(()=>{
       return destBucket.upload(tmpFilePath , {
      destination: 'renamed-' + path.basename(filePath),
      metadata: metaData
    });
  });
});



exports.onDataAdded = functions.database.ref('/message/{id}').onCreate((event , context)=>{
   if (context.params.id === 'copiedData') {
       return;
    }
   const data = event.val();
   const newData = {
     msg: context.params.id + '-' + data.msg.toUpperCase()
   };
   return event.ref.parent.child('copiedData').set(newData);
});
























