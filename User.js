class User {
  constructor(userId, name, email, password, role) {
    this.userId = userId;
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
  }

  getProfile() {
    return {
      userId: this.userId,
      name: this.name,
      email: this.email,
      role: this.role,
    };
  }
}

module.exports = User;
