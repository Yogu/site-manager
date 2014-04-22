var Task = require('../task.js');
var nodemailer = require('nodemailer');

function MailTask(config, subject, contents, recipients) {
	Task.call(this);
	this.siteManager = siteManager;
	this.name = 'Send Mail (subject: ' + subject + ')';
	this.config = config;
	this.subject = subject;
	this.contents = contents;
	this.recipients = recipients;
}

MailTask.prototype = Object.create(Task.prototype);

MailTask.prototype.perform = function*() {
	var transport = nodemailer.createTransport(config.transport, config.transportOptions || {});

	var mailOptions = {
		from: config.sender,
		to: this.recipients.join(', '),
		subject: this.subject,
		text: this.contents
	};

	var response = yield transport.sendMail(mailOptions);
	this.doLog(response);
	transport.close();
};

module.exports = MailTask;
