`set expressjs`
a = server port:1234;
a.route "/a" @req {
 print req;
};
a.start
