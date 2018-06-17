var nodemailer = require('nodemailer');
var mailhelper = {};

mailhelper.transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAILER_USERNAME,
      pass: process.env.MAILER_PASSWORD
    }
});
mailhelper.mailOptions = {
    from: 'shantanu48@gmail.com',
    to: 'contact@salesforcemetadata.io',
    subject: 'New Feedback Received from salesforcemetadata.io',
    text: 'That was easy!',
    html: '<p>Your html here</p>'
};
  
mailhelper.sendEmail = function(feedbackFormObj, callback){

    mailhelper.mailOptions.html = '<p> Feedback Received Details : </p><br />';
    mailhelper.mailOptions.html += '<p> Time : ' + new Date().toISOString() +  ' </p><br />';
    mailhelper.mailOptions.html += '<p> Name : ' + feedbackFormObj.display_name +  ' </p><br />';
    mailhelper.mailOptions.html += '<p> Email : ' + feedbackFormObj.email +  ' </p><br />';
    mailhelper.mailOptions.html += '<p> UserId : ' + feedbackFormObj.user_id +  ' </p><br />';
    mailhelper.mailOptions.html += '<p> OrgId : ' + feedbackFormObj.organization_id +  ' </p><br />';
    mailhelper.mailOptions.html += '<p> Bug : ' + feedbackFormObj.bug +  ' </p><br />';
    mailhelper.mailOptions.html += '<p> Feedback : ' + feedbackFormObj.feedback +  ' </p><br />';
    mailhelper.mailOptions.html += '<p> Message : ' + feedbackFormObj.message +  ' </p><br />';
    
    mailhelper.transporter.sendMail(mailhelper.mailOptions, function(error, info){
        if (error) {
          console.log(error);
          callback(error, null);
        } else {
          console.log('Email sent: ' + info.response);
          callback(null, info.response);
        }
    });
}
module.exports = mailhelper;