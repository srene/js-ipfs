BEGIN	{ TOTAL=0 
	num=0}
	{ if($col!=""){
		TOTAL = TOTAL + $col 
		num++} }
END	{ print TOTAL/num}
