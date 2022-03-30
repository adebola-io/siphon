class Stack {
  arr: Array<any> = [];
  t = 0;
  pop(): any {
    --this.t;
    return this.arr.pop();
  }
  push(data: any) {
    this.arr.push(data);
    ++this.t;
  }
  top() {
    return this.arr[this.t - 1];
  }
  size() {
    return this.t;
  }
}

export default Stack;
