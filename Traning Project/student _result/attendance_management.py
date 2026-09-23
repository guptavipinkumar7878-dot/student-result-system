# Student Result / Attendance System

students = []


# Grade Calculation
def calculate_grade(marks):
    if marks >= 90:
        return "A"
    elif marks >= 80:
        return "B"
    elif marks >= 70:
        return "C"
    elif marks >= 60:
        return "D"
    elif marks >= 50:
        return "E"
    else:
        return "F"


# Input Student Details
n = int(input("Enter number of students: "))

for i in range(n):
    print("\nEnter details of Student", i + 1)

    roll = int(input("Roll Number: "))
    name = input("Name: ")
    marks = float(input("Marks: "))
    attendance = float(input("Attendance (%): "))

    grade = calculate_grade(marks)

    student = {
        "roll": roll,
        "name": name,
        "marks": marks,
        "attendance": attendance,
        "grade": grade
    }

    students.append(student)


# Sorting students by marks - Descending order
def sort_by_marks():
    for i in range(len(students) - 1):
        for j in range(len(students) - i - 1):

            if students[j]["marks"] < students[j + 1]["marks"]:
                students[j], students[j + 1] = students[j + 1], students[j]

    # Assign Rank
    for i in range(len(students)):
        students[i]["rank"] = i + 1


# Display Result
def display_students():
    print("\n================ STUDENT RESULT ================")

    print("Roll\tName\tMarks\tAttendance\tGrade\tRank")
    print("------------------------------------------------")

    for s in students:
        print(
            s["roll"], "\t",
            s["name"], "\t",
            s["marks"], "\t",
            str(s["attendance"]) + "%\t\t",
            s["grade"], "\t",
            s["rank"]
        )


# Perform Sorting and Ranking
sort_by_marks()

display_students()


# Sort by Roll Number for Binary Search
def sort_by_roll():
    for i in range(len(students) - 1):
        for j in range(len(students) - i - 1):

            if students[j]["roll"] > students[j + 1]["roll"]:
                students[j], students[j + 1] = students[j + 1], students[j]


# Binary Search
def binary_search(roll):
    low = 0
    high = len(students) - 1

    while low <= high:

        mid = (low + high) // 2

        if students[mid]["roll"] == roll:
            return mid

        elif students[mid]["roll"] < roll:
            low = mid + 1

        else:
            high = mid - 1

    return -1


# Search Student
sort_by_roll()

roll = int(input("\nEnter Roll Number to search: "))

result = binary_search(roll)

if result != -1:

    s = students[result]

    print("\nStudent Found!")
    print("Roll Number :", s["roll"])
    print("Name        :", s["name"])
    print("Marks       :", s["marks"])
    print("Attendance  :", s["attendance"], "%")
    print("Grade       :", s["grade"])

else:
    print("\nStudent not found!")