module.exports = function(roles) {
  return (req, res, next) => {
    if (!req.usuario || !req.usuario.role) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    const userRole = String(req.usuario.role).toLowerCase();
    const allowedRoles = roles.map(r => String(r).toLowerCase());
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  };
};