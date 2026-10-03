// Compact latching switch; the native Bypass parameter owns the state and automation.
autowatch=1;inlets=1;outlets=1;mgraphics.init();mgraphics.relative_coords=0;mgraphics.autofill=0;
var enabled=0;
function data(s){try{enabled=JSON.parse(s).cfg.bypass?1:0;mgraphics.redraw();}catch(e){}}
function paint(){var g=mgraphics;g.set_source_rgba(.055,.055,.052,1);g.rectangle(0,0,90,20);g.fill();g.select_font_face('Arial');g.set_font_size(10);g.set_source_rgba(enabled?[.98,.73,.43,1]:[.76,.76,.69,1]);g.move_to(0,14);g.show_text('Bypass');g.set_source_rgba(enabled?[.45,.29,.13,1]:[.20,.20,.17,1]);g.rectangle_rounded(47,3,42,15,15,15);g.fill();g.set_source_rgba(enabled?[.98,.73,.43,1]:[.57,.63,.68,1]);g.ellipse(enabled?75:49,5,11,11);g.fill();}
function onclick(){outlet(0,enabled?0:1);}
function anything(){}
