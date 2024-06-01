<!DOCTYPE html>
<html>
<head>
	<title>Quote Generator</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" type="text/css" href="https://bishal.com.au/work/generateQuote.css">

</head>
<body>
	<h1>Quote Generator</h1>
	<form method="post" action="generate_pdf.php">
		<label for="name">Name:</label>
		<input type="text" id="name" name="name" value="Bishal"><br><br>

		<label for="address">Address:</label>
		<input type="text" id="address" name="address" value="50 Sample St, Sample Suburb, VIC 3000"><br><br>

		<label for="phone">Phone Number:</label>
		<input type="text" id="phone" name="phone" value="04123456789"><br><br>

		<label for="inclusions">Inclusions:</label>
		<select multiple id="inclusions" name="inclusions[]">
			<option value="Change of Broken Tiles">Change of Broken Tiles</option>
			<option value="Application of Silicone">Application of Silicone</option>
			<option value="Remove old Mortal">Remove old Mortal</option>
			<option value="Grinding of Ridges">Grinding of Ridges</option>
			<option value="Re Bedding of Ridges">Re Bedding of Ridges</option>
			<option value="Repointing of Ridges">Repointing of Ridges</option>
			<option value="Removal of Waste Masterials from Site">Removal of Waste Masterials from Site</option>
		</select><br><br>

		<label for="total_cost">Total Cost:</label>
		<input type="text" id="total_cost" name="total_cost"><br><br>

		<input type="submit" value="Generate PDF">
	</form>
</body>
</html>
