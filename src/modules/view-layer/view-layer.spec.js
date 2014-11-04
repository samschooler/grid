describe('view-layer', function () {

    var helper = require('@grid/grid-spec-helper')();
    var viewRows = 10;
    var viewCols = 10;
    var view;
    var grid;
    var $ = require('jQuery');
    var container;

    function viewBeforeEach(varyHeight, varyWidth, frows, fcols, hrows, hcols) {
        grid = helper.buildSimpleGrid(100, 20, varyHeight, varyWidth, frows, fcols, hrows, hcols);
        view = grid.viewLayer;
        //mock the view port
        grid.viewPort.sizeToContainer = function () {
        };
        grid.viewPort.rows = viewRows;
        grid.viewPort.cols = viewCols;
        container = helper.viewBuild();
    }

    function findGridCells() {
        return $(container).find('[dts="grid-cell"]');
    }

    function findGridRows() {
        return $(container).find('[dts="grid-row"]');
    }

    function findCellContainer() {
        return $(container).find('[dts=grid-cells]');
    }

    function findColCellsByIndex(index) {
        return $(container).find('[dts="grid-cell"]:nth-child(' + (index + 1) + ')');
    }

    function findRowCellsByIndex(index) {
        return $(findGridRows()[index]).find('[dts="grid-cell"]');
    }

    function findCellByRowCol(r, c) {
        return $(findGridCells(container)[r * viewCols + c]);
    }

    function getCellText(r, c, header) {
        var h = header ? 'h' : '';
        return h + 'r' + r + ' ' + h + 'c' + c;
    }

    function expectOnlyRangeToHaveClass(t, l, h, w, cellClass) {
        for (var r = 0; r < viewRows; r++) {
            for (var c = 0; c < viewCols; c++) {
                var cell = findCellByRowCol(r, c);
                var expectCell = expect(cell);
                if (r < t || r >= t + h || c < l || c >= l + w) {
                    expectCell.not.toHaveClass(cellClass);
                } else {
                    expectCell.toHaveClass(cellClass);
                }

            }
        }
    }

    function expectFirstCellText(text) {
        expect(findGridCells(container).first().text()).toEqual(text);
    }


    function expectFirstAndSecondCell(firstCellWidth) {
        var cells = findGridCells(container);
        expect(cells.first().position()).toEqual({
            top: 0,
            left: 0
        });

        expect(cells.first().width()).toBe(firstCellWidth);
        expect($(cells[1]).position()).toEqual({top: 0, left: firstCellWidth - 1});
    }

    describe('', function () {

        beforeEach(function () {
            viewBeforeEach();
        });


        it('should add a grid element to a supplied container', function () {
            expect(container.firstChild).toBeDefined();
        });

        it('should clear the container before building again', function () {
            view.build(container);
            expect(container.childElementCount).toBe(1);
        });


        it('should create a container for the cells', function () {
            var cellContainer = findCellContainer();
            expect(cellContainer.length).toBe(1);
            expect(cellContainer.hasClass('grid-cells')).toBe(true);
        });

        it('should position the cell container pinned with zindex 0', function () {
            var cellContainer = findCellContainer();
            expect(cellContainer).toBePositioned(0, 0, 0, 0);
            expect(cellContainer.css('zIndex')).toBe('0');
        });

        it('should create rows x cols cells', function (done) {
            view.draw();
            helper.onDraw(function () {
                var gridCells = findGridCells(container);
                expect(gridCells.length).toBe(viewCols * viewRows);
                done();
            });
        });

        it('should clear the cell container before rebuilding the cells', function (done) {
            view.draw();
            helper.onDraw(function () {
                var gridCells = findGridCells(container);
                expect(gridCells.length).toBe(viewCols * viewRows);
                view.draw();
                helper.onDraw(function () {
                    var gridCells = findGridCells(container);
                    expect(gridCells.length).toBe(viewCols * viewRows);
                    done();
                });
            });

        });

        it('shouldnt call build cells if viewport isnt dirty', function (done) {
            helper.resetAllDirties();
            var spy = spyOn(view, '_buildCells');
            view.draw();
            helper.onDraw(function () {
                expect(spy).not.toHaveBeenCalled();
                done();
            });
        });

        describe('redraw', function () {
            function expectRedraw(methods, thingToTriggerRedraw, done) {
                helper.resetAllDirties();
                var drawMethods = methods;
                var spies = drawMethods.map(function (method) {
                    return spyOn(view, method);
                });
                thingToTriggerRedraw();
                helper.onDraw(function () {
                    spies.forEach(function (spy) {
                        expect(spy).toHaveBeenCalled();
                    });
                    done();
                });
            }

            it('should redraw everything if viewPort is dirty', function (done) {
                expectRedraw(['_buildCells', '_buildCols', '_drawCells', '_drawCellClasses', '_drawDecorators'], function () {
                    grid.viewPort.width = 1;
                }, done);
            });

            it('should rebuild colbuilders and draw cells if col builders are dirty', function (done) {
                expectRedraw(['_buildCols', '_drawCells'], function () {
                    grid.colBuilders.set(0, grid.colBuilders.create());
                }, done);
            });

            it('should redraw everything if col model is dirty', function (done) {
                expectRedraw(['_drawCells', '_drawCellClasses', '_drawDecorators'], function () {
                    grid.colModel.add({});
                }, done);
            });

            it('should redraw everything if row model is dirty', function (done) {
                expectRedraw(['_drawCells', '_drawCellClasses', '_drawDecorators'], function () {
                    grid.rowModel.add({});
                }, done);
            });

            it('should redraw cells if data model is dirty', function (done) {
                expectRedraw(['_drawCells'], function () {
                    grid.dataModel.toggleSort();
                }, done);
            });
        });

        it('should add style classes to the cell on draw', function (done) {
            view.draw();
            helper.onDraw(function () {
                expectOnlyRangeToHaveClass(0, 0, viewRows, viewCols, 'grid-cell');
                done();
            });
        });

        it('should wrap rows in a div', function (done) {
            view.draw();
            helper.onDraw(function () {
                var rows = findGridRows();
                expect(rows.length).toBe(viewRows);
                expect(rows.hasClass('grid-row'));
                done();
            });
        });

        it('should add a class to indicate the scroll top is odd', function (done) {
            grid.cellScrollModel.scrollTo(1, 0);
            helper.onDraw(function () {
                expect(findCellContainer()).toHaveClass('odds');
                grid.cellScrollModel.scrollTo(2, 0);
                helper.onDraw(function () {
                    expect(findCellContainer()).not.toHaveClass('odds');
                    done();
                });
            });
        });

        it('should be able to write values to cells', function (done) {
            view.draw();
            helper.onDraw(function () {
                expect(findGridCells(container).first().text()).toEqual(getCellText(0, 0));
                done();
            });
        });


        it('should set the height of rows on draw', function (done) {
            view.draw();
            helper.onDraw(function () {
                var rows = findGridRows();
                expect(rows.first().height()).toBe(31);
                done();
            });
        });

        it('should write widths and heights to the cells on draw', function (done) {
            view.draw();
            helper.onDraw(function () {
                //we want the heights and widths to be rendered at 1 higher than their virtual value in order to collapse the borders 
                expect(findGridCells(container).first().width()).toEqual(101);
                expect(findGridCells(container).first().height()).toEqual(31);
                done();
            });
        });

        it('should write widths and heights with extra border width', function (done) {
            var styleOverride = document.createElement('style');
            styleOverride.innerHTML = '.grid-cell{border : 2px solid black;}';
            document.body.appendChild(styleOverride);
            container = helper.viewBuild();
            view.draw();
            helper.onDraw(function () {
                document.body.removeChild(styleOverride);
                //we want the heights and widths to be rendered at 1 higher than their virtual value in order to collapse the borders 
                expect(findGridCells(container).first().width()).toEqual(102);
                expect(findGridCells(container).first().height()).toEqual(32);
                done();
            });

        });

        it('should write offset values to the cells if scrolled', function (done) {
            grid.cellScrollModel.scrollTo(5, 6);
            helper.onDraw(function () {
                expectFirstCellText(getCellText(5, 6));
                done();
            });
        });

        it('shouldnt call draw cells if cell scroll model isnt dirty', function (done) {

            helper.resetAllDirties();
            var spy = spyOn(view, '_drawCells');
            view.draw();
            helper.onDraw(function () {
                expect(spy).not.toHaveBeenCalled();
                done();
            });
        });

        it('should position the cells in a grid', function (done) {
            view.draw();
            helper.onDraw(function () {
                //the row does the vertical positioning so we have to check the top value of offset and left value of position
                expect(findGridCells(container).last().offset().top).toEqual(30 * (viewRows - 1));
                expect(findGridCells(container).last().position().left).toEqual(100 * (viewCols - 1));
                done();
            });
        });

        it('should notify on draw', function (done) {
            var spy = jasmine.createSpy();
            grid.eventLoop.bind('grid-draw', spy);
            view.draw();
            helper.onDraw(function () {
                expect(spy).toHaveBeenCalled();
                done();
            });
        });

        it('should remove all grid elements on destroy', function () {
            view.destroy();
            expect(container.children.length).toBe(0);
        });

        function makeDivDecorator() {
            var decDiv = document.createElement('div');
            var decorator = grid.decorators.create();

            decorator.render = function () {
                return decDiv;
            };
            decorator.getDiv = function () {
                return decDiv;
            };
            return decorator;
        }

        describe('decorators', function () {
            var decorator;
            beforeEach(function () {
                decorator = makeDivDecorator();
            });

            it('should draw only when dirty', function (done) {
                var spy = spyOn(view, '_drawDecorators'); //treat this as the test that its going to draw
                grid.decorators.add(decorator);
                helper.onDraw(function () {
                    expect(spy).toHaveBeenCalled();
                    spy.calls.reset();
                    grid.viewLayer.draw();
                    helper.onDraw(function () {
                        expect(spy).not.toHaveBeenCalled();
                        done();
                    });
                });
            });

            it('should have a container after the cell container', function () {
                var decoratorContainer = $(container).find('[dts="grid-decorators"]');
                expect(decoratorContainer.length).toBe(1);
                expect(decoratorContainer.prevAll('[dts=grid-cells]').length).toBe(1);
            });

            it('should be positioned pinned to the edges with zindex and pointer events none', function () {
                var decoratorContainer = $(container).find('[dts="grid-decorators"]');
                expect(decoratorContainer).toBePositioned(0, 0, 0, 0);
                expect(decoratorContainer.css('zIndex')).toBe('0');
                expect(decoratorContainer.css('pointerEvents')).toBe('none');
            });

            it('should render a decorator into a container with pointer events none', function (done) {
                grid.decorators.add(decorator);
                helper.onDraw(function () {
                    expect(decorator.getDiv().parentElement).toBeTruthy();
                    expect($(decorator.getDiv()).parents('[dts=grid-decorators]').length).toBe(1);
                    expect(decorator.boundingBox.style.pointerEvents).toBe('none');
                    done();
                });
            });

            function expectDestroySpyToBeCalledAndDecoratorToBeOutOfTheDom(spy) {
                expect(spy).toHaveBeenCalled();
                var boundingBox = decorator.getDiv().parentElement;
                expect(boundingBox.parentElement).toBeFalsy();
                expect(decorator.boundingBox).toBeFalsy();
            }

            it('should receive a destroy event when the grid is cleaned up and not be in the dom', function (done) {
                var spy = jasmine.createSpy();
                decorator.getDiv().addEventListener('decorator-destroy', spy);
                grid.decorators.add(decorator);
                helper.onDraw(function () {
                    view.destroy();
                    expectDestroySpyToBeCalledAndDecoratorToBeOutOfTheDom(spy);
                    done();
                });
            });

            it('should destroy dead decorators on draw', function (done) {
                var spy = jasmine.createSpy();
                decorator.getDiv().addEventListener('decorator-destroy', spy);
                grid.decorators.add(decorator);
                helper.onDraw(function () {
                    grid.decorators.remove(decorator); //remove implicitly calls draw
                    helper.onDraw(function () {
                        expectDestroySpyToBeCalledAndDecoratorToBeOutOfTheDom(spy);
                        done();
                    });
                });
            });

            function setDecoratorPosition(top, left, height, width) {
                decorator.top = top;
                decorator.left = left;
                decorator.height = height;
                decorator.width = width;
            }

            function expectBoundingBoxSize(top, left, height, width, nextFn) {
                helper.onDraw(function () {
                    var $boundingBox = $(decorator.boundingBox);
                    expect($boundingBox.position().top).toBe(top);
                    expect($boundingBox.position().left).toBe(left);
                    expect($boundingBox.height()).toBe(height);
                    expect($boundingBox.width()).toBe(width);
                    expect(decorator.boundingBox.style.position).toEqual('absolute');
                    if (nextFn) {
                        nextFn();
                    }
                });
            }

            it('should position a virtual cell range decorator', function (done) {
                setDecoratorPosition(5, 6, 3, 3);
                grid.decorators.add(decorator);
                // the plus one is so it overlaps the borders
                expectBoundingBoxSize(5 * 30, 6 * 100, 3 * 30 + 1, 3 * 100 + 1, done);
            });

            it('should position a data cell range decorator', function (done) {
                viewBeforeEach(false, false, 0, 0, 1, 1);
                setDecoratorPosition(5, 6, 3, 3);
                grid.decorators.add(decorator);
                decorator.space = 'data';
                // the plus one is so it overlaps the borders
                expectBoundingBoxSize(6 * 30, 7 * 100, 3 * 30 + 1, 3 * 100 + 1, done);
            });

            it('should handle virtual cell ranges that are not in view', function (done) {
                setDecoratorPosition(1, 1, 1, 1);
                grid.cellScrollModel.scrollTo(2, 2);
                grid.decorators.add(decorator);

                helper.onDraw(function () {
                    expect(decorator.boundingBox.style.width).toBe('0px');
                    expect(decorator.boundingBox.style.height).toBe('0px');
                    done();
                });
            });

            it('should handle virtual cell ranges that are not valid', function (done) {
                setDecoratorPosition(-1, -1, -1, -1);
                grid.decorators.add(decorator);

                helper.onDraw(function () {
                    expect(decorator.boundingBox.style.width).toBe('0px');
                    expect(decorator.boundingBox.style.height).toBe('0px');
                    done();
                });
            });

            xit('should position a virtual pixel range decorator', function (done) {
                grid.cellScrollModel.scrollTo(1, 1);
                setDecoratorPosition(5, 6, 2, 3);
                decorator.units = 'px';
                grid.decorators.add(decorator);
                expectBoundingBoxSize(35, 106, 2, 3, done);
            });

            it('should position a real cell range decorator', function (done) {
                setDecoratorPosition(5, 6, 3, 3);
                decorator.space = 'real';
                grid.cellScrollModel.scrollTo(1, 1); //scroll should have no effect on the position;
                grid.decorators.add(decorator);
                // the plus one is so it overlaps the borders
                expectBoundingBoxSize(5 * 30, 6 * 100, 3 * 30 + 1, 3 * 100 + 1, done);
            });

            it('should position a real pixel range decorator', function (done) {
                setDecoratorPosition(5, 6, 2, 4);
                decorator.units = 'px';
                decorator.space = 'real';
                grid.cellScrollModel.scrollTo(1, 1); //scroll should have no effect on the position;
                grid.decorators.add(decorator);
                expectBoundingBoxSize(5, 6, 2, 4, done);

            });

            it('should reposition if decorators box changes', function (done) {
                setDecoratorPosition(5, 6, 2, 3);
                decorator.units = 'px';
                decorator.space = 'real';
                grid.decorators.add(decorator);
                expectBoundingBoxSize(5, 6, 2, 3, function next() {
                    setDecoratorPosition(1, 6, 6, 3);
                    expectBoundingBoxSize(1, 6, 6, 3, done);
                });


            });

            it('should reposition if decorators units changes', function (done) {
                setDecoratorPosition(5, 6, 2, 3);
                decorator.units = 'cell';
                decorator.space = 'real';
                grid.decorators.add(decorator);
                expectBoundingBoxSize(5 * 30, 6 * 100, 2 * 30 + 1, 3 * 100 + 1, function next() {
                    decorator.units = 'px';
                    expectBoundingBoxSize(5, 6, 2, 3, done);
                });
            });

            it('should clamp a decorators height and width to the viewport', function (done) {
                setDecoratorPosition(5, 6, Infinity, Infinity);
                decorator.space = 'real';
                decorator.units = 'px';
                grid.decorators.add(decorator);
                expectBoundingBoxSize(5, 6, grid.viewPort.height, grid.viewPort.width, done);
            });

            it('should reposition if scrolled or col dirty', function () {

            });
        });

        describe('col builders', function () {
            it('should call render for each view row on build', function (done) {
                var builder = grid.colBuilders.create();
                var renderSpy = spyOn(builder, 'render');
                grid.colBuilders.set(0, builder);
                helper.onDraw(function () {
                    expect(renderSpy).toHaveBeenCalled();
                    expect(renderSpy.calls.count()).toBe(grid.viewPort.rows);
                    done();
                });
            });

            it('should put the returned element into the cells for that col', function (done) {
                var builder = grid.colBuilders.create(function () {
                    return document.createElement('a');
                }, function (elem) {
                    return elem;
                });
                grid.colBuilders.set(0, builder);
                helper.onDraw(function () {
                    findColCellsByIndex(0).each(function () {
                        var firstChild = this.firstChild;
                        expect(firstChild.tagName).toBe('A');
                    });
                    done();
                });
            });

            it('should use a text node if the update doesnt return an element', function (done) {
                var builder = grid.colBuilders.create(function () {
                    return document.createElement('a');
                }, function (elem, ctx) {
                    if (ctx.virtualRow === 1) {
                        return undefined;
                    }
                    return elem;
                });
                grid.colBuilders.set(0, builder);
                helper.onDraw(function () {
                    findColCellsByIndex(0).each(function (index) {
                        var firstChild = this.firstChild;
                        if (index === 1) {
                            expect(firstChild.nodeType).toBe(3);
                        } else {
                            expect(firstChild.tagName).toBe('A');
                        }
                    });
                    done();
                });
            });


            it('should call update for each view row on draw', function (done) {
                var builder = grid.colBuilders.create();
                var updateSpy = spyOn(builder, 'update');
                grid.colBuilders.set(1, builder);
                helper.onDraw(function () {
                    expect(updateSpy).toHaveBeenCalled();
                    expect(updateSpy.calls.count()).toBe(grid.viewPort.rows);
                    updateSpy.calls.reset();
                    grid.cellScrollModel.scrollTo(1, 1);
                    helper.onDraw(function () {
                        expect(updateSpy).toHaveBeenCalled();
                        expect(updateSpy.calls.count()).toBe(grid.viewPort.rows);
                        done();
                    });
                });

            });

            it('should not call update for cols out of the view', function (done) {
                var builder = grid.colBuilders.create();
                var updateSpy = spyOn(builder, 'update');
                grid.colBuilders.set(0, builder);
                grid.cellScrollModel.scrollTo(1, 1);
                helper.onDraw(function () {
                    expect(updateSpy).not.toHaveBeenCalled();
                    done();
                });
            });

            it('should pass back the rendered element to the update function', function (done) {
                var aTags = [];
                var updateSpy = jasmine.createSpy('update');
                var builder = grid.colBuilders.create(function () {
                    var aTag = document.createElement('a');
                    aTags.push(aTag);
                    return aTag;
                }, updateSpy);
                grid.colBuilders.set(0, builder);
                helper.onDraw(function () {
                    expect(aTags.length).toBe(grid.viewPort.rows);
                    aTags.forEach(function (aTag, i) {
                        expect(updateSpy.calls.argsFor(i)[0]).toBe(aTag);
                    });
                    done();
                });
            });

            it('should call update with a context obj', function (done) {
                var updateSpy = jasmine.createSpy('update');
                var builder = grid.colBuilders.create(undefined, updateSpy);
                grid.colBuilders.set(1, builder);
                grid.cellScrollModel.scrollTo(1, 1);
                helper.onDraw(function () {
                    for (var r = 0; r < grid.viewPort.rows; r++) {
                        expect(updateSpy.calls.argsFor(r)[1]).toEqual({
                            virtualRow: r + 1,
                            virtualCol: 1,
                            data: grid.dataModel.get(r + 1, 1)
                        });
                    }
                    done();
                });
            });
        });

        describe('cell classes', function () {
            it('should draw the classes only  when dirty', function (done) {
                grid.cellClasses.add(grid.cellClasses.create(1, 1, ''));
                var spy = spyOn(view, '_drawCellClasses');
                helper.onDraw(function () {
                    expect(spy).toHaveBeenCalled();
                    spy.calls.reset();
                    view.draw();
                    helper.onDraw(function () {
                        expect(spy).not.toHaveBeenCalled();
                        done();
                    });
                });

            });

            it('should add a class to a cell', function (done) {
                var cellClass = 'myCellClasssss';
                var descriptor = grid.cellClasses.create(0, 0, cellClass);
                descriptor.space = 'virtual';
                grid.cellClasses.add(descriptor);
                helper.onDraw(function () {
                    expect(findGridCells().first()).toHaveClass(cellClass);
                    done();
                });
            });

            it('should add a class to a range of cells', function (done) {
                var cellClass = 'myRangedClass';
                var descriptor = grid.cellClasses.create(0, 0, cellClass, 2, 3, 'virtual');
                grid.cellClasses.add(descriptor);
                helper.onDraw(function () {
                    expectOnlyRangeToHaveClass(0, 0, 2, 3, cellClass);
                    done();
                });
            });

            it('should add a class to infinite ranges', function (done) {
                var cellClass = 'myRangedClass';
                var descriptor = grid.cellClasses.create(0, 0, cellClass, Infinity, 2, 'virtual');

                grid.cellClasses.add(descriptor);
                helper.onDraw(function () {
                    expectOnlyRangeToHaveClass(0, 0, viewRows, 2, cellClass);
                    grid.cellScrollModel.scrollTo(5, 0);
                    helper.onDraw(function () {
                        expectOnlyRangeToHaveClass(0, 0, viewRows, 2, cellClass);
                        done();
                    });
                });
            });

            it('should clear previous classes on redraw', function (done) {
                var cellClass = 'myCellClasssss';
                var secondClass = 'totallyNewClass';
                var descriptor = grid.cellClasses.create(0, 0, cellClass);
                descriptor.space = 'virtual';
                grid.cellClasses.add(descriptor);
                helper.onDraw(function () {
                    descriptor.class = secondClass;
                    helper.onDraw(function () {
                        expect(findCellByRowCol(0, 0)).toHaveClass(secondClass);
                        expect(findCellByRowCol(0, 0)).not.toHaveClass(cellClass);
                        done();
                    });
                });

            });

            it('should add a class to the right virtual cell after scroll', function (done) {
                var cellClass = 'myCellClasssss';
                var cellClass2 = 'invisible';
                var descriptor = grid.cellClasses.create(1, 1, cellClass);
                descriptor.space = 'virtual';
                var descriptor2 = grid.cellClasses.create(0, 0, cellClass2);
                descriptor2.space = 'virtual';
                grid.cellClasses.add(descriptor);
                grid.cellClasses.add(descriptor2);
                helper.onDraw(function () {
                    var cell = findCellByRowCol(1, 1);
                    expect(cell).toHaveClass(cellClass);
                    var cell2 = findCellByRowCol(0, 0);
                    expect(cell2).toHaveClass(cellClass2);

                    grid.cellScrollModel.scrollTo(1, 1);
                    helper.onDraw(function () {
                        expect(findGridCells().first()).toHaveClass(cellClass);
                        expect(findGridCells().first()).not.toHaveClass(cellClass2);
                        done();
                    });
                });
            });
        });

    });

    describe('varied sizes', function () {

        it('should position on scroll', function (done) {
            viewBeforeEach([20, 30, 40], [99, 100, 101]);
            view.draw();
            helper.onDraw(function () {
                expectFirstAndSecondCell(100);
                grid.cellScrollModel.scrollTo(1, 1);
                helper.onDraw(function () {
                    expectFirstAndSecondCell(101);
                    done();
                });
            });


        });

        it('should write varied widths and heights', function (done) {
            viewBeforeEach([20, 30, 40], [99, 100, 101]);
            view.draw();
            helper.onDraw(function () {
                //we want the heights and widths to be rendered at 1 higher than their virtual value in order to collapse the borders 
                expect(findColCellsByIndex(0).width()).toEqual(100);
                expect(findColCellsByIndex(1).width()).toEqual(101);
                expect(findColCellsByIndex(2).width()).toEqual(102);
                expect(findRowCellsByIndex(0).height()).toEqual(21);
                expect(findRowCellsByIndex(1).height()).toEqual(31);
                expect(findRowCellsByIndex(2).height()).toEqual(41);
                done();
            });
        });
    });

    describe('fixed rows and cols', function () {
        it('should not move rows on scroll', function (done) {
            viewBeforeEach(false, false, 1, 0);
            grid.cellScrollModel.scrollTo(1, 0);
            helper.onDraw(function () {
                expectFirstCellText(getCellText(0, 0));
                done();
            });
        });

        it('should not move cols on scroll', function (done) {
            viewBeforeEach(false, false, 0, 1);
            grid.cellScrollModel.scrollTo(0, 1);
            helper.onDraw(function () {
                expectFirstCellText(getCellText(0, 0));
                done();
            });
        });

        it('should affect positioning of unfixed', function (done) {
            viewBeforeEach(false, false, 1, 0);
            grid.cellScrollModel.scrollTo(1, 0);
            helper.onDraw(function () {
                findGridCells(container);
                done();
            });
        });

        it('should have a class to indicate the last', function (done) {
            viewBeforeEach(false, false, 1, 1);
            helper.onDraw(function () {
                expect(findColCellsByIndex(0)[1]).toHaveClass('grid-last-fixed-col');
                expect(findRowCellsByIndex(0)[1]).toHaveClass('grid-last-fixed-row');
                done();
            });
        });
    });

    describe('headers', function () {
        it('should get a special class', function (done) {
            viewBeforeEach(false, false, 1, 1, 1, 1);

            helper.onDraw(function () {
                expect(findColCellsByIndex(1)[0]).toHaveClass('grid-header grid-col-header');
                expect(findRowCellsByIndex(1)[0]).toHaveClass('grid-header grid-row-header');
                done();
            });
        });

        it('should offset the data by the headers', function (done) {
            viewBeforeEach(false, false, 1, 1, 1, 1);
            helper.onDraw(function () {
                expect(findCellByRowCol(1, 1).text()).toBe(getCellText(0, 0));
                done();
            });
        });

        it('should set the contents of the headers', function (done) {
            viewBeforeEach(false, false, 1, 1, 1, 1);
            helper.onDraw(function () {
                expect(findCellByRowCol(0, 0).text()).toBe(getCellText(0, 0, true));
                done();
            });
        });

        xit('should add a class to a range of cells in the data space', function (done) {
            var cellClass = 'myRangedClass';
            var descriptor = grid.cellClasses.create(0, 0, cellClass, 2, 3, 'data');
            grid.cellClasses.add(descriptor);
            helper.onDraw(function () {
                expectOnlyRangeToHaveClass(1, 1, 2, 3, cellClass);
                done();
            });
        });
    });

})
;