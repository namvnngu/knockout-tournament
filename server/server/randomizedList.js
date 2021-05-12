class RandomizedList {
  constructor(srcList) {
    this.list = [];
    this.srcList = srcList;
  }

  next() {
    if (this.list.length === 0) {
      this.list = this.srcList.slice();
    }

    const randomIndex = Math.floor(Math.random() * this.list.length);
    return this.list.splice(randomIndex, 1)[0];
  }
}

module.exports = RandomizedList;
