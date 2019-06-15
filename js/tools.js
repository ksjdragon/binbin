function get(name) {
    ele = document.querySelectorAll(name)
    return (ele.length === 1) ? ele[0] : ele;
}