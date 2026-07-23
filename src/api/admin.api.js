import client from './client';

export const getMailConfigApi = () => client.get('/admin/mail-config');
export const updateMailConfigApi = (data) => client.post('/admin/mail-config', data);
