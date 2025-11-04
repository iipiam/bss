import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeviceLayout, type TableColumn } from "@/lib/mobileLayout";

interface TableListProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  mobileCardRender?: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function TableList<T>({ 
  data, 
  columns, 
  keyExtractor, 
  onRowClick,
  mobileCardRender,
  emptyMessage = "No data available"
}: TableListProps<T>) {
  const { isMobile } = useDeviceLayout();

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item) => {
          const key = keyExtractor(item);
          
          // Use custom mobile card renderer if provided
          if (mobileCardRender) {
            return (
              <Card 
                key={key}
                className={onRowClick ? "cursor-pointer hover-elevate active-elevate-2" : ""}
                onClick={() => onRowClick?.(item)}
              >
                <CardContent className="p-3">
                  {mobileCardRender(item)}
                </CardContent>
              </Card>
            );
          }

          // Default mobile card renderer
          return (
            <Card 
              key={key}
              className={onRowClick ? "cursor-pointer hover-elevate active-elevate-2" : ""}
              onClick={() => onRowClick?.(item)}
            >
              <CardContent className="p-3 space-y-2">
                {columns.filter(col => !col.hideOnMobile).map((column, idx) => {
                  const value = column.render
                    ? column.render(item)
                    : String((item as any)[column.key] ?? '');
                  
                  return (
                    <div key={idx} className="flex justify-between items-start gap-2">
                      <span className="text-xs font-medium text-muted-foreground min-w-24">
                        {column.mobileLabel || column.header}:
                      </span>
                      <span className="text-sm font-medium text-right flex-1">
                        {value}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop table view
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column, idx) => (
            <TableHead key={idx}>{column.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow
            key={keyExtractor(item)}
            className={onRowClick ? "cursor-pointer" : ""}
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((column, idx) => (
              <TableCell key={idx}>
                {column.render
                  ? column.render(item)
                  : String((item as any)[column.key] ?? '')}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
