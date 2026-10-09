export function toSessionUser(user) {
  if (!user || typeof user.id !== 'string' || typeof user.role !== 'string') return null;
  const { password: _password, ...publicUser } = user;
  return publicUser;
}
