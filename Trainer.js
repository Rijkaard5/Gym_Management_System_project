const User = require("./User");

class Trainer extends User {
  constructor(userId, name, email, password, specialization, experience) {
    super(userId, name, email, password, "trainer");
    this.specialization = specialization;
    this.experience = experience;
  }

  getProfile() {
    return {
      ...super.getProfile(),
      specialization: this.specialization,
      experience: this.experience,
    };
  }
}

module.exports = Trainer;
