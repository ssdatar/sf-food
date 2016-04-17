import csv
import json

food_dict = {}
master_list = []

#open csv file to read in
with open('food.csv', 'r', errors='ignore') as csvfile:
    #open json file to write to
    with open('food.json', 'w') as json_out:
        reader = csv.reader(csvfile)
        next(reader, None) #skip header row

        #read each row as a list of data
        for row in reader:

            #make a dict for this row
            food_dict = {'Day': row[0],
                          'PermitLocation': row[5],
                          'optionaltext': row[7],
                          'starts': row[10],
                          'ends': row[11],
                          'Latitude': row[21],
                          'Longitude': row[22]
                          }
            
            #append this row to master list
            master_list.append(food_dict)
            
        #write the master list to a json file
        json_data = json.dumps(master_list, indent=2)
        json_out.write(json_data)