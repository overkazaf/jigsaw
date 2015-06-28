/**
 * [Jigsaw puzzle]
 * @param  {[jQuery operator]} $ [description]
 * @return {[type]}   [description]
 */
;(function($){
	var log = function (k, v){
		window.console && window.console.log && (v ? console.log(k, v) : console.log(k));
	};

	$.fn.Jigsaw = function(options){
		return this.each(function(){
			var that = this;
			var containerRect = {
				width : $(that).width(),
				height : $(that).height()
			};
			var opt = $.extend({}, options, $.fn.Jigsaw.defaults);
			var $movedElement = null;
			var currentIndex = -1;
			var currentOffset = {};
			var jigsaw = {
				blocks : [],
				indexArray : [],
				$fragment : null,
				init : function(){
					this.initLayout();
					this.shuffle();
					this.rebuildFragment();
					this.render();
					this.bindEvents();
				},
				restart : function (){
					this.shuffle();
					this.rebuildFragment();
					this.render();
					this.bindEvents();
				},
				initLayout : function(){
					var c,
						r,
						_this_ = this,
						$this = $(opt.context),
						w = parseInt(containerRect.width / opt.col),
						h = parseInt(containerRect.height / opt.row),
						bg = 'url('+opt.src+')',
						$fragment = $(document.createDocumentFragment());

					for (var i = 0, r = opt.row; i < r; i++) {
						for (var j = 0, c = opt.col; j < c; j++) {
							var x = j*w + 'px';
							var y = i*h + 'px';
							var index = i*r + j;
							var div = $('<div>').css({
								position : 'absolute',
								cursor : 'pointer',
								left : x,
								top : y,
								width : w + 'px',
								height : h + 'px',
								border : '1px solid #baff00',
								'box-sizing' : 'border-box',
								background : bg,
								'background-position' : '-' + x + ' -' + y
							}).attr('data-index', index);
							_this_.blocks.push(div);
							_this_.indexArray.push(index);
						}
					}
					this.$fragment = $fragment;
				},
				shuffle : function(){
					if (!Array.prototype.shuffle) {
					    Array.prototype.shuffle = function() {
					        for(var j, x, i = this.length; i; j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
					        return this;
					    };
					}
					var indexArray = this.indexArray;
					indexArray.shuffle();
				},
				rebuildFragment : function(){
					var blocks = this.blocks;
					var $fragment = this.$fragment;
					var indexArray = this.indexArray;

					$fragment.html('');

					var w = parseInt(containerRect.width / opt.col),
						h = parseInt(containerRect.height / opt.row);
					for (var i=0;i<opt.row; i++) {
						for (var j=0;j<opt.col; j++){
							var current = i*opt.row + j;
							var ic = indexArray[current];
							var l = Math.floor(ic / opt.row);
							var t = ic % opt.col;

							l = l*w + 'px';
							t = t*h + 'px';
							var x = i*w + 'px';
							var y = j*h + 'px';
							blocks[current].css({
								left : l,
								top : t,
								'z-index' : 0,
								'background-position' : '-' + x +' -' + y
							}).attr({
								'class' : opt.blockClass
							});
							$fragment.append(blocks[current]);
						}
					}
				},
				swapBlock : function(fromIndex, toIndex){

					var blocks = this.blocks;
					var targetLeft = currentOffset.left;
					var targetTop = currentOffset.top;
					if (fromIndex === -1) {
						// reset position
						$movedElement.animate({
							left : targetLeft + 'px',
							top : targetTop + 'px'
						}, opt.animateTime , 'swing', function(){
							$movedElement.css('z-index', 0);
							$movedElement = null;
							jigsaw.checkSuccess();
						}); 
					} else {
						
						var to = blocks[toIndex];
						var toOffset = to.offset();
						var tl = toOffset.left - $(that).offset().left;
						var tt = toOffset.top - $(that).offset().top;
						$movedElement.animate({
							left : tl + 'px',
							top : tt + 'px'
						},opt.animateTime ,  'swing', function(){
							$movedElement.css('z-index', 0);
							$movedElement = null;
						}); 

						to.animate({
							left : targetLeft + 'px',
							top : targetTop + 'px'
						}, opt.animateTime, 'swing', function(){
							jigsaw.checkSuccess();
						});
						
						currentIndex = -1; 
					}
					

					// update position
					// $movedElement.css({
					// 	'z-index' : 0,
					// 	left : deltaX + 'px',
					// 	top : deltaY + 'px'
					// });
				},
				render : function(){
					this.$fragment.appendTo($('#map'));
				},
				bindEvents : function(){
					var _this_ = this;
					var blocks = this.blocks;
					$.each(blocks, function(){
						$(this).on('mousedown', _this_.dragStart);
					});
				},
				dragStart : function(ev){
					var _this_ = this;
					ev = ev || window.event;
					
					if(ev.which !== 1)return;

					var x = ev.pageX;
					var y = ev.pageY;
					var target = ev.target || ev.srcElement;
					var $target = $(target);
					var offset = $target.offset();
					currentIndex = $target.attr('data-index');
					
					var offsetL = offset.left - $(that).offset().left;
					var offsetT = offset.top - $(that).offset().top;
					currentOffset = {
						left : offsetL,
						top : offsetT
					};

					var originX = x - offsetL;
					var originY = y - offsetT;

					$movedElement = $target.css({
						'z-index' : 10
					});

					$target.attr('data-x', originX);
					$target.attr('data-y', originY);
					$(document).on('mousemove', jigsaw.dragging);
					$(document).on('mouseup', jigsaw.dragEnd);
				},
				dragging : function(ev){
					ev = ev || window.event;
					var x = ev.pageX;
					var y = ev.pageY;
					var deltaX = x - $movedElement.attr('data-x');
					var deltaY = y - $movedElement.attr('data-y');
					$movedElement.css({
						left : deltaX + 'px',
						top : deltaY + 'px'
					});
				},
				dragEnd : function(ev){
					ev = ev || window.event;
					var x = ev.pageX;
					var y = ev.pageY;
					var toIndex = jigsaw.checkHoverIndex({x : x, y : y});
					if(-1 != toIndex){
						//log('from ' + currentIndex + ' to ' + toIndex);
						jigsaw.swapBlock(currentIndex, toIndex);
					} else {
						jigsaw.swapBlock(-1, currentIndex);
					}
					$(document).off('mousemove', jigsaw.dragging);
					$(document).off('mouseup', jigsaw.dragEnd);
				},
				checkSuccess : function(){
					var pos = jigsaw.calcPosition();
					var flag = true;

					for (var i=0, l=pos.length; i<l; i += opt.row) {
						var s = pos[i];
						for (var j=i+1, lr = opt.row-1; lr>0; j++,lr--) {
							//log(pos[j].left, pos[j].top);
							if(s.left <= pos[j].left && s.top < pos[j].top){
								continue;
							} else {
								flag = false;break;
							}
						}
					}
					if(flag){
						alert('You\'ve already crack the jigsaw puzzle!');
						// if(confirm('One more time?')){
						// 	//jigsaw.restart();
						// }
					}

				},
				checkHoverIndex : function(offset){
					var pos = jigsaw.calcPosition();
					var blocks = this.blocks;
					var x = offset.x;
					var y = offset.y;
					for (var i=0,l=pos.length; i<l; i++) {
						if(i == currentIndex)continue;
						var c = pos[i];
						if (x >= c.left && x <= c.right && y >= c.top && y <= c.bottom){ 
							return i;
						}
					}
					return -1;
				},
				calcPosition : function(){

					var blocks = this.blocks;
					var pos = [];
					$.each(blocks, function(idx){
						var offset = $(this).offset();
						var w = $(this).outerWidth();
						var h = $(this).outerHeight();
						var os = {
							left : offset.left,
							top :offset.top,
							right : offset.left + w,
							bottom : offset.top + h
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
		});
	};




	$.fn.Jigsaw.defaults = {
		row : 3,
		col : 3,
		animateTime : 500,
		context : '#map',
		blockClass : 'block',
		src : 'images/demo.jpg'
	};

})(jQuery)