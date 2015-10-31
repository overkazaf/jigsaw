/**
 * [Jigsaw puzzle]
 * @param  {[jQuery operator]} $ [description]
 * @return {[type]}   [description]
 */
;
(function($) {
    var log = function(k, v) {
        window.console && window.console.log && (v ? console.log(k, v) : console.log(k));
    };
    var cache;
    $.fn.Jigsaw = function(options) {
    	if ($(this).attr('data-jigsaw')) {
    		cache.destroy();
    		cache = null;
    		$(this).removeAttr('data-jigsaw');
    	}

        return this.each(function() {

            var that = this;
            var containerRect = {
                width: $(that).width(),
                height: $(that).height()
            };

            var
                opt = $.extend({}, $.fn.Jigsaw.defaults, options || {}),
                $time = $(opt.timeSpan),
                $movedElement = null,
                currentIndex = -1,
                currentOffset = {},
                jigsaw = {
                    counter: null,
                    startTime: 0,
                    elapse: 0,
                    blocks: [],
                    isAnimating: false,
                    indexArray: [],
                    status: 'end',
                    $fragment: null,
                    init: function() {
                    	this.timerStop();
                        this.initLayout();
                        this.shuffle();
                        this.rebuildFragment();
                        this.render();
                        this.bindEvents();

                        return this;
                    },
                    restart: function() {
                        this.shuffle();
                        this.rebuildFragment();
                        this.render();
                        this.bindEvents();
                    },
                    initLayout: function() {
                        var c,
                            r,
                            blocks = this.blocks,
                            indexArray = this.indexArray,
                            $this = $(opt.context),
                            w = parseInt(containerRect.width / opt.col),
                            h = parseInt(containerRect.height / opt.row),
                            bg = 'url(' + opt.src + ')',
                            $fragment = $(document.createDocumentFragment());

                        for (var i = 0, r = opt.row; i < r; i++) {
                            for (var j = 0, c = opt.col; j < c; j++) {

                                var x = j * w + 'px',
                                    y = i * h + 'px',
                                    index = i * opt.col + j,
                                    div = $('<div>').css({
                                        position: 'absolute',
                                        cursor: 'pointer',
                                        width: w,
                                        height: h,
                                        outline: '2px solid #fff',
                                        'box-shadow': '0 0 10px #aaa',
                                        'box-sizing': 'border-box',
                                        background: bg,
                                        'border-radius': '10px',
                                        'background-position': '-' + x + ' -' + y
                                    }).attr('data-index', index);

                                blocks.push(div);

                                indexArray.push(index);
                            }
                        }

                        this.$fragment = $fragment;
                    },
                    shuffle: function() {
                        if (!Array.prototype.shuffle) {
                            Array.prototype.shuffle = function() {
                                for (var j, x, i = this.length; i; j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
                                return this;
                            };
                        }

                        var
                            indexArray = this.indexArray,
                            tests = '',
                            tot = opt.col * opt.row;

                        for (var k = 0; k < tot; k++) {
                            if (k) tests += ',';
                            tests += k;
                        }

                        indexArray.shuffle();

                        while (indexArray.join(',') === tests) {
                            indexArray.shuffle();
                        };
                    },
                    rebuildFragment: function() {
                        var blocks = this.blocks,
                            $fragment = this.$fragment,
                            indexArray = jigsaw.indexArray;

                        $fragment.html('');

                        var w = parseInt(containerRect.width / opt.col),
                            h = parseInt(containerRect.height / opt.row);

                        var arr = [];
                        for (var i = 0; i < opt.row; i++) {
                            for (var j = 0; j < opt.col; j++) {
                                // verticle push
                                var
                                    current = parseInt(i * opt.col + j),
                                    ic = indexArray[current],
                                    t = Math.floor(ic / opt.col),
                                    l = ic % opt.col;

                                l = l * w + 'px';
                                t = t * h + 'px';

                                var y = i * h + 'px';
                                var x = j * w + 'px';

                                blocks[current].css({
                                    left: l,
                                    top: t,
                                    'z-index': 0,
                                    'background-position': '-' + x + ' -' + y
                                }).attr({
                                    'class': opt.blockClass
                                });
                                $fragment.append(blocks[current]);
                            }
                        }
                    },
                    swapBlock: function(fromIndex, toIndex) {

                        var blocks = this.blocks,
                            targetLeft = currentOffset.left,
                            targetTop = currentOffset.top;


                        jigsaw.isAnimating = true;
                        if (fromIndex === -1) {
                            // reset position
                            $movedElement.animate({
                                left: targetLeft + 'px',
                                top: targetTop + 'px',
                                'opacity': 1
                            }, opt.animateTime, 'swing', function() {
                                $movedElement.css('z-index', 0);
                                $movedElement = null;
                                jigsaw.checkSuccess();
                                jigsaw.isAnimating = false;
                            });
                        } else {

                            var to = blocks[toIndex],
                                toOffset = to.offset(),
                                tl = toOffset.left - $(that).offset().left,
                                tt = toOffset.top - $(that).offset().top;

                            $movedElement.animate({
                                left: tl + 'px',
                                top: tt + 'px',
                                'opacity': 1
                            }, opt.animateTime, 'swing', function() {
                                $movedElement.css('z-index', 0);
                                $movedElement = null;
                            });

                            to.animate({
                                left: targetLeft + 'px',
                                top: targetTop + 'px'
                            }, opt.animateTime, 'swing', function() {
                                jigsaw.checkSuccess();
                                jigsaw.isAnimating = false;
                            });

                            currentIndex = -1;
                        }
                    },
                    destroy : function (){
                    	this.timerStop();
                    	this.unbindEvents();
                    },
                    render: function() {
                        this.$fragment.appendTo($(opt.context));
                        $(that).data('status', 'running');
                        jigsaw.timerReset();
                    },
                    timerStart: function() {
                        jigsaw.counter = setInterval(function() {
                            jigsaw.elapse++;
                            $time.html('Time elapses: ' + jigsaw.elapse + ' seconds');
                        }, 1000);
                    },
                    timerStop: function() {
                        jigsaw.elapse = 0;
                        clearInterval(jigsaw.counter);
                        jigsaw.counter = null;
                        $time.html('');
                    },
                    timerReset: function() {
                        jigsaw.timerStop();
                        jigsaw.timerStart();
                    },
                    off: function() {
                        var _this_ = this;
                        var blocks = this.blocks;
                        $.each(blocks, function() {
                            $(this).off('mousedown', _this_.dragStart);
                        });
                    },
                    bindEvents: function() {
                        var _this_ = this;
                        var blocks = this.blocks;
                        $.each(blocks, function() {
                            $(this).off('mousedown').on('mousedown', _this_.dragStart);
                        });
                    },
                    unbindEvents : function () {
                    	var _this_ = this;
                        var blocks = this.blocks;
                        $.each(blocks, function() {
                            $(this).off('mousedown', _this_.dragStart);
                        });
                    },
                    dragStart: function(ev) {
                        var _this_ = this;
                        ev = ev || window.event;
                        if (jigsaw.isAnimating) return;
                        if (ev.which !== 1) return;

                        var x = ev.pageX,
                            y = ev.pageY,
                            target = ev.target || ev.srcElement,
                            $target = $(target),
                            offset = $target.offset();
                        currentIndex = $target.attr('data-index');

                        var offsetL = offset.left - $(that).offset().left;
                        var offsetT = offset.top - $(that).offset().top;
                        currentOffset = {
                            left: offsetL,
                            top: offsetT
                        };

                        var originX = x - offsetL;
                        var originY = y - offsetT;

                        $movedElement = $target.css({
                            'z-index': 10
                        });

                        $target.attr('data-x', originX);
                        $target.attr('data-y', originY);
                        $(document).on('mousemove', jigsaw.dragging);
                        $(document).on('mouseup', jigsaw.dragEnd);
                        return false;
                    },
                    dragging: function(ev) {
                        ev = ev || window.event;
                        var x = ev.pageX;
                        var y = ev.pageY;
                        var deltaX = x - $movedElement.attr('data-x');
                        var deltaY = y - $movedElement.attr('data-y');
                        $movedElement.css({
                            left: deltaX + 'px',
                            top: deltaY + 'px',
                            'opacity': 0.7
                        });
                    },
                    dragEnd: function(ev) {
                        ev = ev || window.event;
                        var x = ev.pageX;
                        var y = ev.pageY;
                        var toIndex = jigsaw.checkHoverIndex({
                            x: x,
                            y: y
                        });
                        if (-1 != toIndex) {
                            //log('from ' + currentIndex + ' to ' + toIndex);
                            jigsaw.swapBlock(currentIndex, toIndex);
                        } else {
                            jigsaw.swapBlock(-1, currentIndex);
                        }
                        $(document).off('mousemove', jigsaw.dragging);
                        $(document).off('mouseup', jigsaw.dragEnd);
                    },
                    checkSuccess: function() {
                        var pos = jigsaw.calcPosition();
                        var flag = true;
                        log(pos);
                        log(opt.row);
                        // log('========================= Comparing =========================');
                        for (var r = 0, l = pos.length, lastTop = -999; r < Math.floor(l/opt.col); r++) {
                        	var rowStart = Math.floor(r*opt.col);
                            var k = 0;
                            log('RowStart:' + rowStart);
                            while (k < opt.col-1) {
                            	var pre = pos[rowStart + k],
                            		next = pos[rowStart + k + 1];
                            	if (pre.top == next.top && lastTop < pre.top) {
                            		if (pre.left < next.left) {
	                            		k++;
	                            	} else {
	                            		flag = false; break;
	                            	}
                            	} else {
                            		flag = false; break;
                            	}
                            }

                            if (!flag) break;
                            lastTop = pos[rowStart].top;

                        }
                        if (flag) {
                            alert('You\'ve already crack the jigsaw puzzle in ' + jigsaw.elapse + ' seconds!');

                            $(that).data('status', '');
                            if (confirm('One more time?')) {
                                jigsaw.restart();
                            } else {
                            	jigsaw.timerStop();
                            }
                        }

                    },
                    checkHoverIndex: function(offset) {
                        var pos = jigsaw.calcPosition(),
                            blocks = this.blocks,
                            x = offset.x,
                            y = offset.y;

                        for (var i = 0, l = pos.length; i < l; i++) {
                            if (i == currentIndex) continue;
                            var c = pos[i];
                            if (x >= c.left && x <= c.right && y >= c.top && y <= c.bottom) {
                                return i;
                            }
                        }
                        return -1;
                    },
                    calcPosition: function() {

                        var blocks = this.blocks,
                            pos = [];

                        $.each(blocks, function(idx) {
                            var offset = $(this).offset(),
                                w = $(this).outerWidth(),
                                h = $(this).outerHeight(),
                                os = {
                                    left: offset.left,
                                    top: offset.top,
                                    right: offset.left + w,
                                    bottom: offset.top + h
                                };
                            //log(os);
                            pos.push(os);
                        });
                        //log('========current==============', currentIndex);
                        //log(pos[currentIndex]);
                        return pos;
                    }
                };
            jigsaw.init();
            cache = jigsaw;
            $(this).attr('data-jigsaw', true);
        });
    };




    $.fn.Jigsaw.defaults = {
        row: 3,
        col: 3,
        animateTime: 250,
        context: '#map',
        blockClass: 'block',
        src: 'images/demo.jpg',
        timeSpan: '#timeSpan'
    };

})(jQuery)
