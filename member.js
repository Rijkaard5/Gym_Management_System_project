const User = require("./User");

class Member extends User {
  constructor(userId, name, email, password, membershipId, joinDate, status) {
    super(userId, name, email, password, "member");
    this.membershipId = membershipId;
    this.joinDate = joinDate;
    this.status = status; // Active, Expired, Suspended
  }

  isActive() {
    return this.status === "Active";
  }

  getProfile() {
    return {
      ...super.getProfile(),
      membershipId: this.membershipId,
      status: this.status,
    };
  }
}

module.exports = Member;
