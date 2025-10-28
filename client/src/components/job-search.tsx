import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Briefcase, ChevronsUpDown, IndianRupee } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface JobSearchProps {
  onSearch: (filters: {
    search: string;
    location: string;
    jobType: string;
    salary: string;
  }) => void;
  className?: string;
}

const dropdownVariants = {
  open: {
    opacity: 1,
    scale: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  closed: {
    opacity: 0,
    scale: 0.9,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  open: { opacity: 1, y: 0 },
  closed: { opacity: 0, y: -10 },
};

const LOCATIONS = [
  "All Locations",
  "Pune",
  "New delhi",
  "Nashik",
  "Kolkata",
    "Mumbai",
  "Chennai",
  "Bangalore",
  "Amritsar",
  "Nagpur",
];

const JOB_TYPES = ["All Jobs", "Full-time", "Part-time", "Contract", "Internship"];

const SALARY_RANGES = [
  "All Salaries",
  "₹0 - ₹500k",
  "₹500k - ₹1000k",
  "₹1000k - ₹1500k",
  "₹1500k+",
];

const JOB_TITLES = [
  "All Job Titles",
  // Tech Jobs
  "Web Developer",
  "Software Engineer", 
  "Data Scientist",
  "UX Designer",
  "Product Manager",
  "Senior Full Stack Developer",
  "Machine Learning Engineer",
  "DevOps Cloud Architect",
  "Mobile App Developer",
  "Cloud Solutions Architect",
  "Cybersecurity Analyst",
  "Blockchain Developer",
  "Data Engineer",
  "QA Automation Engineer",
  "Systems Administrator",
  "Technical Writer",
  "Sales Engineer",
  "HR Technology Specialist",
  "Financial Software Developer",
  "E-commerce Developer",
  "Game Developer",
  "AR/VR Engineer",
  "IoT Solutions Architect",
  "Embedded Systems Engineer",
  "React Native Developer",
  "Vue.js Frontend Lead",
  "Node.js Backend Expert",
  "Python Django Developer",
  "Java Spring Boot Developer",
  ".NET Core Specialist",
  "Go Language Engineer",
  "Flutter Mobile Developer",
  "AWS Solutions Architect", 
  "Azure Cloud Engineer",
  "Kubernetes Administrator",
  "Database Architect",
  "MySQL Database Administrator",
  "Machine Learning Ops Engineer",
  "Computer Vision Engineer",
  "Technical Product Manager",
  "Web3 Developer",
  "Cybersecurity Threat Hunter",
  
  // Local Jobs
  "Carpenter",
  "Plumber",
  "Electrician",
  "House Maid",
  "Cleaner",
  "Wireman",
  "Architect",
  "Watchman",
  "Delivery Man",
  "Driver",
  "Cook",
  "Gardener",
  "Security Guard",
  "Receptionist",
  "Office Assistant",
  "Sales Executive",
  "Accountant",
  "Teacher",
  "Nurse",
  "Doctor",
  "Mechanic",
  "Painter",
  "Mason",
  "Welder",
  "Tailor",
  "Beautician",
  "Barber",
  "Driver",
  "Delivery Boy",
  "Peon",
  "Supervisor",
  "Manager",
  "Cashier",
  "Waiter",
  "Chef",
  "Housekeeper",
  "Babysitter",
  "Elderly Caretaker",
  "Driver Cum Helper",
  "Office Boy"
];

export default function JobSearch({ onSearch, className = "" }: JobSearchProps) {
  const [jobTitle, setJobTitle] = useState("All Job Titles");
  const [location, setLocation] = useState("All Locations");
  const [jobType, setJobType] = useState("All Jobs");
  const [salary, setSalary] = useState("All Salaries");

  const handleSearch = () => {
    onSearch({
      search: jobTitle === "All Job Titles" ? "" : jobTitle,
      location: location === "All Locations" ? "" : location,
      jobType: jobType === "All Jobs" ? "" : jobType,
      salary: salary === "All Salaries" ? "" : salary,
    });
  };

  const AnimatedDropdown = ({
    value,
    setValue,
    options,
    icon: Icon,
    label
  }: { value: string; setValue: (v: string) => void; options: string[]; icon: any; label: string }) => {
    const [open, setOpen] = useState(false);

    return (
      <div className="relative w-full">
        <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between pl-10 rounded-xl h-12">
              <span className="truncate text-left">{value}</span>
              <motion.span
                animate={open ? { rotate: 180 } : { rotate: 0 }}
                transition={{ duration: 0.1 }}
              >
                <ChevronsUpDown className="h-4 w-4 opacity-60" />
              </motion.span>
            </Button>
          </DropdownMenuTrigger>
          <div className="pointer-events-none absolute left-3 top-[2.35rem] text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <AnimatePresence>
            {open && (
              <DropdownMenuContent forceMount className="w-[var(--radix-dropdown-trigger-width)] p-0" align="start">
                <motion.div
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={dropdownVariants}
                  className="p-2 rounded-lg bg-background shadow-xl"
                >
                  {options.map((option) => (
                    <DropdownMenuItem key={option} onSelect={() => setValue(option)}>
                      <motion.div
                        variants={itemVariants}
                        className="flex items-center gap-2 w-full p-2 text-sm font-medium rounded-md hover:bg-accent text-foreground hover:text-accent-foreground transition-colors cursor-pointer"
                      >
                        <span>{option}</span>
                      </motion.div>
                    </DropdownMenuItem>
                  ))}
                </motion.div>
              </DropdownMenuContent>
            )}
          </AnimatePresence>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <Card className={className + " border-0 bg-red/90 backdrop-blur-xl shadow-lg"}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <AnimatedDropdown
            value={jobTitle}
            setValue={setJobTitle}
            options={JOB_TITLES}
            icon={Search}
            label="Job Title or Skills"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AnimatedDropdown
              value={location}
              setValue={setLocation}
              options={LOCATIONS}
              icon={MapPin}
              label="Location"
            />
            <AnimatedDropdown
              value={jobType}
              setValue={setJobType}
              options={JOB_TYPES}
              icon={Briefcase}
              label="Job Type"
            />
            <AnimatedDropdown
              value={salary}
              setValue={setSalary}
              options={SALARY_RANGES}
              icon={IndianRupee}
              label="Salary"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button 
            onClick={handleSearch} 
            className="w-full md:w-2/3 lg:w-1/2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 text-lg"
          >
            Search Jobs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
