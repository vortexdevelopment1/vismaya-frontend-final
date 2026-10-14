/**
 * Test Outbox Helper
 * Collects emails and SMS sent during test runs without sending real messages
 */

const emails = [];
const smsList = [];

const recordEmail = (email) => {
    emails.push({ ...email, sentAt: new Date() });
};

const recordSms = (sms) => {
    smsList.push({ ...sms, sentAt: new Date() });
};

const getEmails = () => [...emails];
const getSmsList = () => [...smsList];

const getLastEmail = () => emails[emails.length - 1] || null;
const getLastSms = () => smsList[smsList.length - 1] || null;

const clearOutbox = () => {
    emails.length = 0;
    smsList.length = 0;
};

module.exports = {
    recordEmail,
    recordSms,
    getEmails,
    getOutbox: getEmails,
    getSmsList,
    getLastEmail,
    getLastSms,
    clearOutbox
};
