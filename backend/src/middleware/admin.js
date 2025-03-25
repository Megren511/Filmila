const admin = (req, res, next) => {
  console.log('Admin middleware - Current user:', req.user);
  
  if (!req.user) {
    console.log('Admin middleware - No user found');
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    console.log('Admin middleware - User is not admin:', req.user.role);
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }

  console.log('Admin middleware - Access granted');
  next();
};

module.exports = admin;
