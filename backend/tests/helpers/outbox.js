/**
 * Test Outbox Helper
 * Collects emails and SMS sent during test runs without sending real messages
 */

const emails = [];
const smsList = [];

export const recordEmail = (email) => {
    emails.push({ ...email, sentAt: new Date() });
};

export const recordSms = (sms) => {
    smsList.push({ ...sms, sentAt: new Date() });
};

export const getEmails = () => [...emails];
export const getOutbox = getEmails;
export const getSmsList = () => [...smsList];

export const getLastEmail = () => emails[emails.length - 1] || null;
export const getLastSms = () => smsList[smsList.length - 1] || null;

export const clearOutbox = () => {
    emails.length = 0;
    smsList.length = 0;
};

export default {
    recordEmail,
    recordSms,
    getEmails,
    getOutbox,
    getSmsList,
    getLastEmail,
    getLastSms,
    clearOutbox
};
