const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice'); // inlines the CSS so it works in email clients
const htmlToText = require('html-to-text'); // converts html to text
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const generateHTML = (filename, options = {}) => { // this converts the pug to html - renderFile is a function from pug (which we imported above)
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`,
    options); // dirname is current directly we are running the file from
  const inlined = juice(html); // converts the CSS and HTML to inlined
  return inlined;
};

exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);
  const mailOptions = {
    from: `Rob P <noreply@RobP.com>`,
    to: options.user.email,
    subject: options.subject,
    html,
    text
  };
  const sendMail = promisify(transport.sendMail, transport);
  return sendMail(mailOptions);
};
