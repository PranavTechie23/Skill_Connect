
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface JobCategoryDropdownProps {
  categories: string[];
  onSelectCategory: (category: string) => void;
}

export function JobCategoryDropdown({ categories, onSelectCategory }: JobCategoryDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Select Category</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => onSelectCategory('All')}>All Categories</DropdownMenuItem>
        {categories.map((category) => (
          <DropdownMenuItem key={category} onSelect={() => onSelectCategory(category)}>
            {category}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
