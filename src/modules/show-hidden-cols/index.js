module.exports = function (_grid) {
    var grid = _grid;

    var api = {_decorators: {}};

    function createDecorator(col) {
        var headerDecorator = grid.decorators.create(0, col, 1, 1, 'cell', 'virtual');

        headerDecorator.postRender = function (div) {
            div.style.transform = 'translate(-50%, -50%)';
            div.style.webkitTransform = 'translate(-50%, -50%)';

            div.style.removeProperty('right');
            div.style.removeProperty('bottom');
            div.style.top = '50%';
            div.setAttribute('class', 'show-hidden-cols');

            grid.eventLoop.bind('click', div, function () {
                while (grid.colModel.get(col - 1).hidden) {
                    col--;
                    grid.colModel.get(col).hidden = false;
                }
            });
        };
        return headerDecorator;
    }

    grid.eventLoop.bind('grid-col-change', function (e) {
        if (e.action === 'hide' || e.action === 'add') {
            e.descriptors.forEach(function (descriptor) {
                var col = descriptor.index;
                if (!col && col !== 0) {
                    return;
                }
                if (descriptor.hidden) {
                    var decorator = createDecorator(col + 1);
                    grid.decorators.add(decorator);
                    api._decorators[col] = decorator;
                } else {
                    var decorator = api._decorators[col];
                    grid.decorators.remove(decorator);
                    api._decorators[col] = undefined;
                }
            });
        }
    });

    return api;
};